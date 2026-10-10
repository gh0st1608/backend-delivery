variable "name" {
  type = string
}

variable "description" {
  type    = string
  default = ""
}

variable "integrations" {
  description = "Mapa clave => Lambda destino y prefijos de ruta que atiende"
  type = map(object({
    function_name = string
    invoke_arn    = string
    path_prefixes = list(string)
  }))
}

variable "throttling_burst_limit" {
  type    = number
  default = 100
}

variable "throttling_rate_limit" {
  type    = number
  default = 50
}

variable "log_retention_days" {
  type    = number
  default = 14
}

variable "tags" {
  type    = map(string)
  default = {}
}
