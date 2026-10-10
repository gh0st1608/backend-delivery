# infra-delivery

Infraestructura como código (Terraform) del backend **FoodStore**. Vive en la rama `infra` y se trabaja como *worktree* dentro de `backend-delivery/`, igual que los microservicios (`backend-auth`, `backend-order`, ...).

## Estructura (por entornos y módulos)

```
infra-delivery/
├── modules/                    # Módulos reutilizables (sin lógica de entorno)
│   ├── catalog/                #   Definiciones del backend: tablas, colas, servicios, variables de entorno (no crea recursos)
│   ├── dynamodb/               #   Tablas DynamoDB a partir de un mapa
│   ├── messaging/              #   Bus EventBridge + colas SQS con DLQ + reglas + identidad SES
│   ├── s3-bucket/              #   Bucket privado y versionado
│   ├── lambda-service/         #   Lambda + rol IAM + logs + triggers SQS + invocación programada
│   ├── http-api/               #   API Gateway HTTP con rutas por prefijo
│   ├── codebuild-service/      #   CodeBuild + webhook que despliega una Lambda
│   ├── design-site/            #   Sitio estático de diseño (S3 público + CodeBuild)
│   └── dotenv/                 #   Genera archivos .env
├── environments/               # Configuración por entorno
│   ├── dev/                    #   LocalStack, estado local
│   │   ├── main.tf  variables.tf  outputs.tf  backend.tf
│   └── prod/                   #   AWS, estado en Terraform Cloud (solutionserj / backend-delivery)
│       ├── main.tf  variables.tf  outputs.tf  backend.tf
│       ├── imports.tf.example  terraform.tfvars.example
├── localstack/docker-compose.yml
└── .gitignore
```

Cada entorno llama a los mismos módulos con sus propios valores. Lo que necesita el backend (tablas, eventos, variables) se declara **una sola vez** en `modules/catalog`, y ambos entornos lo consumen, así dev y prod no se desincronizan.

## Qué despliega cada entorno

| Recurso | Detalle | dev | prod |
|---|---|:-:|:-:|
| DynamoDB | `Users`, `Preferences`, `RefreshTokens` (TTL), `Products`, `Categories`, `Carts`, `Orders`, `Couriers`, `Settings`, `Payments` con sus GSI | ✅ | ✅ (PITR + protección de borrado) |
| EventBridge | bus `foodstore-events` (`EVENT_BUS_NAME`) | ✅ | ✅ |
| SQS | `foodstore-notification-email` ← `auth-service / EmailVerificationRequested`<br>`foodstore-order-events` ← `payment-service / PaymentApproved` (ambas con DLQ) | ✅ | ✅ |
| SES | identidad del remitente (`SES_SOURCE_EMAIL`) | ✅ | ✅ |
| S3 | `foodstore-microservices-lambdas-functions` (zips de CodeBuild) | ✅ | ✅ |
| Lambda | `foodstore-<servicio>-service` ×6, triggers SQS (order con `ReportBatchItemFailures`) y `rate(1 minute)` para reintentar asignaciones | opcional | ✅ |
| API Gateway HTTP | `/auth` `/shop` `/checkout` `/order` `/courier` `/payment` | — | ✅ |
| CodeBuild | `build-<servicio>-foodstore` con webhook al push de la rama del servicio | — | ✅ |
| Sitio de diseño | `build-design-foodstore` + bucket `foodstore-design` (existente) | — | ✅ |
| `.env` generados | `environments/dev/generated/<servicio>.env` | ✅ | — |

> Terraform crea las Lambdas con un código *placeholder* e ignora cambios de código: el código real lo publica CodeBuild con el `buildspec.yml` de cada servicio.

## dev — LocalStack

```bash
docker compose -f localstack/docker-compose.yml up -d

cd environments/dev
terraform init
terraform apply
```

El `apply` genera `environments/dev/generated/<servicio>.env` con lo que se creó (bus, colas, tablas, `AWS_ENDPOINT_URL`...). Combínalo con el `.env` de cada servicio y añade los secretos (JWT, PayPal, `INTERNAL_API_KEY`).

Los servicios apuntan a LocalStack **sin cambios de código** gracias a `AWS_ENDPOINT_URL` (soportado por el AWS SDK v3 que usan). Si los servicios corren en Docker:

```bash
terraform apply -var services_aws_endpoint=http://host.docker.internal:4566
```

Para desplegar también las Lambdas dentro de LocalStack: `-var enable_lambdas=true`.

## prod — AWS

1. **Workspace de Terraform Cloud**: si está conectado por VCS, su *Terraform Working Directory* debe ser `environments/prod` (antes era `infra`).
2. **Variables del workspace**: los secretos como *sensitive* (`jwt_private_key`, `jwt_public_key`, `internal_api_key`, `paypal_client_id`, `paypal_client_secret`). Los no secretos están en `terraform.tfvars.example`. También hacen falta las credenciales de AWS.
3. **Recursos ya existentes**: si las tablas, Lambdas o el bucket ya existen en AWS, copia los bloques de `imports.tf.example` al final de `main.tf` antes del primer `apply`.
4. Los recursos del sitio de diseño se movieron de la raíz al módulo `design-site`; los bloques `moved` de `main.tf` hacen que Terraform los reubique en el estado **sin recrearlos**. El primer `plan` debe mostrarlos como *moved*, no como *destroy/create*.

```bash
cd environments/prod
terraform init
terraform plan
terraform apply
```

## Flujo para actualizar la infra

```bash
cd backend-delivery/infra-delivery     # worktree de la rama infra
git pull
# Nueva tabla/cola/variable que necesita el backend → modules/catalog/main.tf
# Nuevo tipo de recurso → un módulo en modules/ y su llamada en environments/*/main.tf
terraform -chdir=environments/dev apply   # probar en LocalStack
git commit -am "..." && git push          # Terraform Cloud planifica prod
```

## Limitaciones conocidas

- **WebSocket de backend-order** (`/ws/`, Socket.IO): no funciona en Lambda. Requiere un servicio de larga duración (ECS/Fargate) o migrar a API Gateway WebSocket.
- **Secretos como variables de entorno** de Lambda: lo siguiente sería moverlos a SSM Parameter Store / Secrets Manager.
