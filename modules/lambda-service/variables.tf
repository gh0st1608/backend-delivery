variable "name" {
  type        = string
  description = "Nombre de la función (debe coincidir con LAMBDA_NAME del buildspec)"
}

variable "description" {
  type    = string
  default = ""
}

variable "handler" {
  type    = string
  default = "handler.handler"
}

variable "runtime" {
  type    = string
  default = "nodejs20.x"
}

variable "memory_size" {
  type    = number
  default = 512
}

variable "timeout" {
  type    = number
  default = 30
}

variable "environment" {
  type      = map(string)
  default   = {}
  sensitive = true
}

# =============================
# 🔐 Permisos
# =============================
variable "dynamodb_table_arns" {
  type        = list(string)
  default     = []
  description = "Tablas (y sus índices) a las que la función tiene acceso CRUD"
}

variable "publish_events" {
  type    = bool
  default = false
}

variable "event_bus_arn" {
  type    = string
  default = ""
}

variable "allow_ses_send" {
  type    = bool
  default = false
}

# =============================
# ⚡ Disparadores
# =============================
variable "sqs_triggers" {
  description = "Colas SQS que invocan la función"
  type = map(object({
    queue_arn                  = string
    batch_size                 = optional(number, 10)
    report_batch_item_failures = optional(bool, false)
  }))
  default = {}
}

variable "schedule_expression" {
  type        = string
  default     = null
  description = "Expresión rate()/cron() para invocarla periódicamente"
}

variable "log_retention_days" {
  type    = number
  default = 14
}

variable "tags" {
  type    = map(string)
  default = {}
}
