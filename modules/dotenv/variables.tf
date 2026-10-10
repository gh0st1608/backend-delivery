variable "directory" {
  type = string
}

variable "files" {
  type        = map(map(string))
  description = "nombre_archivo => variables"
}

variable "common" {
  type        = map(string)
  default     = {}
  description = "Variables que se añaden a todos los archivos"
}

variable "header" {
  type    = string
  default = "# Generado por Terraform. No editar a mano."
}
