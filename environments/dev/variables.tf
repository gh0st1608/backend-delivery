variable "project" {
  type    = string
  default = "foodstore"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "localstack_endpoint" {
  type        = string
  default     = "http://localhost:4566"
  description = "Endpoint de LocalStack que usa Terraform"
}

variable "services_aws_endpoint" {
  type        = string
  default     = "http://localhost:4566"
  description = "AWS_ENDPOINT_URL de los .env (http://host.docker.internal:4566 si los servicios corren en Docker)"
}

variable "services_base_url" {
  type        = string
  default     = "http://localhost:8080"
  description = "Gateway local (nginx) para las llamadas entre servicios"
}

variable "event_bus_name" {
  type    = string
  default = "foodstore-events"
}

variable "ses_sender_email" {
  type    = string
  default = "no-reply@foodstore.local"
}

variable "cors_origins" {
  type    = string
  default = "http://localhost:5173,http://localhost:3000,http://localhost:8080"
}

variable "artifacts_bucket_name" {
  type    = string
  default = "foodstore-microservices-lambdas-functions"
}

variable "enable_lambdas" {
  type        = bool
  default     = false
  description = "true para desplegar también las Lambdas dentro de LocalStack"
}
