variable "name_prefix" {
  type = string
}

variable "event_bus_name" {
  type = string
}

variable "queues" {
  description = "Mapa nombre_cola => { event_pattern (JSON) de la regla que la alimenta }"
  type = map(object({
    event_pattern = string
  }))
}

variable "visibility_timeout_seconds" {
  type        = number
  default     = 180
  description = "Debe ser >= timeout de la Lambda consumidora"
}

variable "max_receive_count" {
  type    = number
  default = 5
}

variable "ses_sender_email" {
  type        = string
  default     = ""
  description = "Remitente de SES. Vacío = no se crea la identidad"
}

variable "tags" {
  type    = map(string)
  default = {}
}
