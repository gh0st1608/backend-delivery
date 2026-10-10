variable "tables" {
  description = "Mapa nombre_tabla => definición"
  type = map(object({
    hash_key      = string
    range_key     = optional(string)
    attributes    = map(string)
    ttl_attribute = optional(string)
    owner         = optional(string)
    indexes = optional(list(object({
      name      = string
      hash_key  = string
      range_key = optional(string)
    })), [])
  }))
}

variable "point_in_time_recovery" {
  type    = bool
  default = false
}

variable "deletion_protection" {
  type    = bool
  default = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
