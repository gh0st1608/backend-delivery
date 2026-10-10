output "event_bus_name" {
  value = aws_cloudwatch_event_bus.this.name
}

output "event_bus_arn" {
  value = aws_cloudwatch_event_bus.this.arn
}

output "queue_arns" {
  value = { for name, q in aws_sqs_queue.this : name => q.arn }
}

output "queue_urls" {
  value = { for name, q in aws_sqs_queue.this : name => q.url }
}

output "dlq_urls" {
  value = { for name, q in aws_sqs_queue.dlq : name => q.url }
}
