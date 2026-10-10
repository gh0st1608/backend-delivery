output "http_api_url" {
  value = module.http_api.api_endpoint
}

output "lambda_functions" {
  value = { for svc, m in module.lambda : svc => m.function_name }
}

output "dynamodb_tables" {
  value = module.dynamodb.table_names
}

output "event_bus_name" {
  value = module.messaging.event_bus_name
}

output "queue_urls" {
  value = module.messaging.queue_urls
}

output "codebuild_projects" {
  value = { for svc, m in module.codebuild : svc => m.project_name }
}

output "s3_bucket_website_endpoint" {
  value = module.design_site.website_endpoint
}
