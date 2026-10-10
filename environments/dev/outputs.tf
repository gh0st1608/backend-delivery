output "dynamodb_tables" {
  value = module.dynamodb.table_names
}

output "event_bus_name" {
  value = module.messaging.event_bus_name
}

output "queue_urls" {
  value = module.messaging.queue_urls
}

output "lambda_functions" {
  value = { for svc, m in module.lambda : svc => m.function_name }
}

output "generated_env_files" {
  value = module.dotenv.files
}
