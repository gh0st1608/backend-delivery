output "tables" {
  description = "Definición de tablas DynamoDB (entrada del módulo dynamodb)"
  value       = local.tables
}

output "queues" {
  description = "Colas SQS y la regla de EventBridge que las alimenta (entrada del módulo messaging)"
  value       = local.queues
}

output "services" {
  description = "Metadatos de cada microservicio"
  value       = local.services
}

output "service_env" {
  description = "Variables de entorno no secretas por servicio"
  value       = local.service_env
}

output "secret_env" {
  description = "Variables de entorno secretas por servicio"
  value       = local.secret_env
  sensitive   = true
}
