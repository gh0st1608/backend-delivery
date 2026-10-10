# =============================================================
# 🧪 Entorno dev — LocalStack
# -------------------------------------------------------------
# Los microservicios corren con docker compose / npm run start:dev
# contra LocalStack. API Gateway v2 y CodeBuild no existen en
# LocalStack Community, así que aquí no se crean.
# =============================================================

provider "aws" {
  region                      = var.aws_region
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true

  endpoints {
    cloudwatch     = var.localstack_endpoint
    cloudwatchlogs = var.localstack_endpoint
    dynamodb       = var.localstack_endpoint
    events         = var.localstack_endpoint
    iam            = var.localstack_endpoint
    lambda         = var.localstack_endpoint
    s3             = var.localstack_endpoint
    ses            = var.localstack_endpoint
    sqs            = var.localstack_endpoint
    sts            = var.localstack_endpoint
  }

  default_tags {
    tags = local.tags
  }
}

locals {
  tags = {
    Project     = var.project
    Environment = "dev"
    ManagedBy   = "terraform"
  }

  lambda_services = var.enable_lambdas ? module.catalog.services : {}
}

# =============================
# 🧩 Definiciones del backend
# =============================
module "catalog" {
  source = "../../modules/catalog"

  aws_region       = var.aws_region
  event_bus_name   = var.event_bus_name
  shop_base_url    = "${var.services_base_url}/shop"
  order_base_url   = "${var.services_base_url}/order"
  ses_sender_email = var.ses_sender_email

  app_config = {
    cors_origins                = var.cors_origins
    paypal_env                  = "sandbox"
    payment_allowed_return_urls = var.cors_origins
    refresh_cookie_secure       = "false"
    refresh_cookie_samesite     = "lax"
  }
}

# =============================
# 🗄️ Datos y mensajería
# =============================
module "dynamodb" {
  source = "../../modules/dynamodb"

  tables = module.catalog.tables
}

module "messaging" {
  source = "../../modules/messaging"

  name_prefix      = var.project
  event_bus_name   = var.event_bus_name
  queues           = module.catalog.queues
  ses_sender_email = var.ses_sender_email
}

module "artifacts_bucket" {
  source = "../../modules/s3-bucket"

  name = var.artifacts_bucket_name
}

# =============================
# λ Lambdas (opcional en dev)
# =============================
module "lambda" {
  source   = "../../modules/lambda-service"
  for_each = local.lambda_services

  name        = "${var.project}-${each.key}-service"
  description = each.value.description
  memory_size = each.value.memory_size

  environment = merge(
    { NODE_ENV = "development" },
    module.catalog.service_env[each.key],
  )

  dynamodb_table_arns = [
    for name, t in module.catalog.tables : module.dynamodb.table_arns[name] if t.owner == each.key
  ]
  publish_events = each.value.publishes_events
  event_bus_arn  = module.messaging.event_bus_arn
  allow_ses_send = each.value.sends_email

  sqs_triggers = {
    for name, q in module.catalog.queues : name => {
      queue_arn                  = module.messaging.queue_arns[name]
      report_batch_item_failures = q.report_batch_item_failures
    } if q.consumer == each.key
  }
  schedule_expression = each.value.schedule
}

# =============================
# 🔗 .env por servicio con lo creado en LocalStack
# (los secretos JWT / PayPal / INTERNAL_API_KEY se añaden a mano)
# =============================
module "dotenv" {
  source = "../../modules/dotenv"

  directory = "${path.module}/generated"
  header    = "# Generado por Terraform (environments/dev). No editar a mano."

  common = {
    NODE_ENV              = "development"
    AWS_REGION            = var.aws_region
    AWS_LOCAL             = "true"
    AWS_ACCESS_KEY_ID     = "test"
    AWS_SECRET_ACCESS_KEY = "test"
    AWS_ENDPOINT_URL      = var.services_aws_endpoint
  }

  files = {
    for svc, env in module.catalog.service_env : svc => merge(
      env,
      svc == "order" ? { ORDER_EVENTS_QUEUE_URL = module.messaging.queue_urls["order-events"] } : {},
    )
  }
}
