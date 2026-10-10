variable "project" {
  type    = string
  default = "foodstore"
}

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "Región de AWS donde se desplegarán los recursos"
}

variable "repository_url" {
  type    = string
  default = "https://github.com/gh0st1608/backend-delivery"
}

# =============================
# ⚙️ Plataforma
# =============================
variable "event_bus_name" {
  type    = string
  default = "foodstore-events"
}

variable "ses_sender_email" {
  type        = string
  default     = ""
  description = "Remitente verificado en SES (SES_SOURCE_EMAIL)"
}

variable "artifacts_bucket_name" {
  type        = string
  default     = "foodstore-microservices-lambdas-functions"
  description = "Bucket de los lambda.zip (S3_BUCKET de los buildspec)"
}

variable "create_artifacts_bucket" {
  type        = bool
  default     = true
  description = "false si el bucket de artefactos se gestiona fuera de Terraform"
}

variable "enable_cicd" {
  type        = bool
  default     = true
  description = "Crea un CodeBuild + webhook por microservicio"
}

variable "service_branches" {
  type        = map(string)
  description = "Rama de git de cada microservicio (dispara su CodeBuild)"
  default = {
    auth         = "auth"
    shop         = "shop"
    checkout     = "checkout"
    order        = "order"
    payment      = "payment"
    notification = "notification"
  }
}

variable "log_retention_days" {
  type    = number
  default = 30
}

# =============================
# 🌐 Configuración de la app
# =============================
variable "cors_origins" {
  type    = string
  default = ""
}

variable "paypal_env" {
  type    = string
  default = "sandbox"
}

variable "payment_allowed_return_urls" {
  type    = string
  default = ""
}

# =============================
# 🔐 Secretos: variables "sensitive" del workspace en
# Terraform Cloud, nunca en el repositorio.
# =============================
variable "jwt_private_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "jwt_public_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "internal_api_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "paypal_client_id" {
  type      = string
  sensitive = true
  default   = ""
}

variable "paypal_client_secret" {
  type      = string
  sensitive = true
  default   = ""
}
