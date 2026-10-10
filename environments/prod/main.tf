# =============================================================
# 🏭 Entorno prod — AWS
# =============================================================

provider "aws" {
  region = var.aws_region
}

locals {
  tags = {
    Project     = var.project
    Environment = "prod"
    ManagedBy   = "terraform"
  }
}

# =============================
# 🧩 Definiciones del backend
# =============================
module "catalog" {
  source = "../../modules/catalog"

  aws_region       = var.aws_region
  event_bus_name   = var.event_bus_name
  shop_base_url    = "${module.http_api.api_endpoint}/shop"
  order_base_url   = "${module.http_api.api_endpoint}/order"
  ses_sender_email = var.ses_sender_email

  app_config = {
    cors_origins                = var.cors_origins
    paypal_env                  = var.paypal_env
    payment_allowed_return_urls = var.payment_allowed_return_urls
    refresh_cookie_secure       = "true"
    refresh_cookie_samesite     = "none" # web y API en dominios distintos
  }

  secrets = {
    jwt_private_key      = var.jwt_private_key
    jwt_public_key       = var.jwt_public_key
    internal_api_key     = var.internal_api_key
    paypal_client_id     = var.paypal_client_id
    paypal_client_secret = var.paypal_client_secret
  }
}

# =============================
# 🗄️ Datos y mensajería
# =============================
module "dynamodb" {
  source = "../../modules/dynamodb"

  tables                 = module.catalog.tables
  point_in_time_recovery = true
  deletion_protection    = true
  tags                   = local.tags
}

module "messaging" {
  source = "../../modules/messaging"

  name_prefix      = var.project
  event_bus_name   = var.event_bus_name
  queues           = module.catalog.queues
  ses_sender_email = var.ses_sender_email
  tags             = local.tags
}

module "artifacts_bucket" {
  source = "../../modules/s3-bucket"
  count  = var.create_artifacts_bucket ? 1 : 0

  name = var.artifacts_bucket_name
  tags = local.tags
}

# =============================
# λ Lambdas de los microservicios
# =============================
module "lambda" {
  source   = "../../modules/lambda-service"
  for_each = module.catalog.services

  name               = "${var.project}-${each.key}-service"
  description        = each.value.description
  memory_size        = each.value.memory_size
  log_retention_days = var.log_retention_days
  tags               = merge(local.tags, { Service = each.key })

  environment = merge(
    { NODE_ENV = "production" },
    module.catalog.service_env[each.key],
    module.catalog.secret_env[each.key],
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
# 🌐 API Gateway HTTP (equivalente del nginx.conf local)
# El WebSocket /ws/ de order no se publica: requiere ECS o API GW WebSocket.
# =============================
module "http_api" {
  source = "../../modules/http-api"

  name               = "${var.project}-api"
  description        = "API pública de FoodStore (prod)"
  log_retention_days = var.log_retention_days
  tags               = local.tags

  integrations = {
    for svc, cfg in module.catalog.services : svc => {
      function_name = module.lambda[svc].function_name
      invoke_arn    = module.lambda[svc].invoke_arn
      path_prefixes = cfg.http_prefixes
    } if length(cfg.http_prefixes) > 0
  }
}

# =============================
# 🚀 CI/CD: un CodeBuild por microservicio (push a su rama)
# =============================
module "codebuild" {
  source   = "../../modules/codebuild-service"
  for_each = var.enable_cicd ? var.service_branches : {}

  name                 = "build-${each.key}-${var.project}"
  description          = "Compila y despliega backend-${each.key} en Lambda"
  aws_region           = var.aws_region
  repository_url       = var.repository_url
  branch               = each.value
  artifacts_bucket     = var.artifacts_bucket_name
  zip_key              = "${each.key}/lambda.zip"
  lambda_function_name = module.lambda[each.key].function_name
  lambda_function_arn  = module.lambda[each.key].function_arn
  tags                 = merge(local.tags, { Service = each.key })
}

# =============================
# 🎨 Sitio de diseño (recursos preexistentes)
# =============================
module "design_site" {
  source = "../../modules/design-site"

  aws_region     = var.aws_region
  repository_url = var.repository_url
}

# Los recursos de diseño vivían en la raíz (infra/*.tf): se mueven
# al módulo sin destruirlos ni recrearlos.
moved {
  from = module.s3_bucket
  to   = module.design_site.module.s3_bucket
}

moved {
  from = aws_codebuild_project.design
  to   = module.design_site.aws_codebuild_project.design
}

moved {
  from = aws_codebuild_webhook.design
  to   = module.design_site.aws_codebuild_webhook.design
}

moved {
  from = aws_iam_role.codebuild_service_role
  to   = module.design_site.aws_iam_role.codebuild_service_role
}

moved {
  from = aws_iam_policy.codebuild_s3_policy
  to   = module.design_site.aws_iam_policy.codebuild_s3_policy
}

moved {
  from = aws_iam_policy.codebuild_logs_policy
  to   = module.design_site.aws_iam_policy.codebuild_logs_policy
}

moved {
  from = aws_iam_role_policy_attachment.codebuild_attach_s3
  to   = module.design_site.aws_iam_role_policy_attachment.codebuild_attach_s3
}

moved {
  from = aws_iam_role_policy_attachment.codebuild_attach_logs
  to   = module.design_site.aws_iam_role_policy_attachment.codebuild_attach_logs
}
