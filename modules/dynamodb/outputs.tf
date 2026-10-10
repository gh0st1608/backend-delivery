output "table_arns" {
  value = { for name, t in aws_dynamodb_table.this : name => t.arn }
}

output "table_names" {
  value = { for name, t in aws_dynamodb_table.this : name => t.name }
}
