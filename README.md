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
├── local/                      # Levantar todo en local con un comando
│   ├── up.sh  down.sh
│   └── scripts/                #   env-setup, seed (datos de prueba) y e2e
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

## Levantar todo en local (LocalStack + backends + frontend)

Un solo comando levanta la app completa en tu máquina, sin tocar AWS:

```bash
cd backend-delivery/infra-delivery/local
./up.sh            # app web en http://localhost:8081
./up.sh --lan      # app en tu celular con Expo Go (misma red Wi-Fi)
./up.sh --e2e      # además ejecuta la prueba de punta a punta del backend
./down.sh          # detiene todo (./down.sh --all también detiene LocalStack)
```

### Requisitos

- Docker, Terraform ≥ 1.5, Node.js ≥ 20.19.4 y Git Bash (Windows) o bash (macOS/Linux)
- Esta disposición de carpetas: los servicios como worktrees dentro de `backend-delivery/` y el frontend al lado.

```
foodstore-sdc-v2/
├── backend-delivery/              # rama gateway
│   ├── backend-auth/ … backend-shop/   # worktrees: rama de cada servicio
│   └── infra-delivery/            # worktree: rama infra
└── frontend-delivery/             # rama develop
```

Si tus carpetas están en otra parte, indícalo con `BACKEND_DIR=... FRONTEND_DIR=... ./up.sh`.

### Qué hace `up.sh`

| Paso | Detalle |
|---|---|
| 1. Requisitos | Verifica herramientas y Docker; si falta `node_modules`, ejecuta `npm install` |
| 2. LocalStack | `localstack/docker-compose.yml` (LocalStack 4.4) en `:4566` |
| 3. Infraestructura | `terraform apply` de `environments/dev` **sin Lambdas**: las colas SQS las consumen los servicios locales |
| 4. Variables | Crea los `.env.local` que falten desde `.env.local.example`. Genera un par de claves JWT RS256 y una `INTERNAL_API_KEY` locales si están vacías, y apunta las URLs del frontend a `localhost` o a tu IP (`--lan`) |
| 5. Backends | Arranca los 6 servicios con `NODE_ENV=local npm run start:dev` (recargan al guardar) |
| 6. Datos de prueba | 3 categorías y 5 productos (con imagen, precio en CLP y stock) en una tienda de Lima, más un repartidor y su simulador de ubicación |
| 7. Frontend | `expo start --web` (o `--lan` para Expo Go) en `:8081` |

Es **re-ejecutable**: lo que ya está corriendo no se duplica y el seed no crea registros repetidos. Logs y PIDs quedan en `local/.run/` (ignorado por git).

| Servicio | URL |
|---|---|
| LocalStack | http://localhost:4566 |
| auth | http://localhost:3000/auth |
| notification | http://localhost:3001 |
| shop | http://localhost:3002/shop |
| checkout | http://localhost:3003/checkout |
| order (y Socket.IO) | http://localhost:3004/order |
| payment | http://localhost:3005/payment |
| frontend web | http://localhost:8081 |

### Variables de entorno: `.env.local` y `.env.production`

Cada servicio carga `.env.${NODE_ENV}`. Sin `NODE_ENV` carga `.env.local`; con `NODE_ENV=production`, `.env.production`.

| Archivo | Uso | ¿Se versiona? |
|---|---|---|
| `.env.local.example` | Plantilla LocalStack (`AWS_ENDPOINT_URL=http://localhost:4566`, credenciales `test`) | ✅ |
| `.env.production.example` | Plantilla AWS | ✅ |
| `.env.local` / `.env.production` | Valores reales y secretos | ❌ (en `.gitignore`) |

En el frontend Expo funciona igual: `expo start` usa `.env.local` y `expo export`, `.env.production`.

> ⚠️ En una misma máquina, `.env.local` tiene prioridad incluso al exportar para producción. Si generas un build de producción en local, renombra antes tu `.env.local`.

**Valores que debes completar a mano:**
- **`backend-payment/.env.local`:** `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET` de **sandbox** (developer.paypal.com → Apps & Credentials). Sin ellos, el pago falla.
- **`frontend-delivery/.env.local`:** `EXPO_PUBLIC_API_KEY_GOOGLE`. Sin ella no funcionan el mapa ni la geocodificación del checkout.

### Probar la app

- **Navegador:** abre http://localhost:8081. En Chrome, `F12` → *Toggle device toolbar* (`Ctrl+Shift+M`) simula un celular.
- **Celular con Expo Go:** ejecuta `./up.sh --lan` e ingresa en Expo Go la URL `exp://<tu-ip>:8081` que muestra el script.
  - El celular debe estar en la misma Wi-Fi.
  - Permite Node.js en el firewall (puertos 3000-3005 y 8081).
  - Expo Go de las tiendas solo soporta el SDK más reciente de Expo. Si no coincide con el del proyecto (54), usa un *development build* (`eas build --profile development`).
- **Emulador Android:** instala Android Studio, crea un AVD y, con `./up.sh` corriendo, presiona `a` en la terminal de Expo o ejecuta `npx expo start --android`. El emulador llega al host en `10.0.2.2`, así que en `frontend-delivery/.env.local` cambia `localhost` por `10.0.2.2`.
- **Pago con PayPal:** en la pantalla de PayPal inicia sesión con una **cuenta compradora sandbox** (developer.paypal.com → Sandbox → Accounts).
- **Código de "olvidé mi contraseña":** en local no se envían correos, porque nadie consume la cola de notificaciones. Léelo de LocalStack:

  ```bash
  docker exec foodstore-localstack awslocal dynamodb scan --table-name Users \
    --filter-expression "email = :e" --expression-attribute-values '{":e":{"S":"tu@correo.com"}}' \
    --query "Items[0].verificationCode.S"
  ```

### Prueba de punta a punta

`./up.sh --e2e`, o `node local/scripts/e2e.js` con todo corriendo, recorre el flujo con las mismas llamadas que la app:
1. Registro, preferencias, carrito y orden con precios del catálogo.
2. Pago en PayPal sandbox.
3. `PaymentApproved` simulado → SQS → orden PAID → repartidor asignado → entrega confirmada.
4. Rotación del refresh token y revocación de la sesión cuando se reusa un token rotado.

### Notas

- **Datos efímeros:** LocalStack Community no persiste datos. Tras `./down.sh --all`, o si se reinicia el contenedor, el siguiente `./up.sh` recrea la infraestructura y los datos de prueba.
- **AWS real, imposible:** `up.sh` quita `AWS_PROFILE` del entorno y los `.env.local` apuntan a `http://localhost:4566`, así que nada sale a una cuenta real.
- **Lambdas en LocalStack:** para levantarlas también, `terraform -chdir=environments/dev apply -var enable_lambdas=true`. Ojo: compiten con los servicios locales por las colas SQS.

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
