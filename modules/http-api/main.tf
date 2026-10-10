# =============================================================
# 🌐 API Gateway HTTP delante de Lambdas
# -------------------------------------------------------------
# Cada integración publica "ANY /<prefijo>" y "ANY /<prefijo>/{proxy+}".
# Payload 1.0: compatible con aws-serverless-express.
# =============================================================

locals {
  routes = merge([
    for key, integ in var.integrations : merge([
      for prefix in integ.path_prefixes : {
        "ANY /${prefix}"          = key
        "ANY /${prefix}/{proxy+}" = key
      }
    ]...)
  ]...)
}

resource "aws_apigatewayv2_api" "this" {
  name          = var.name
  protocol_type = "HTTP"
  description   = var.description
  tags          = var.tags
}

resource "aws_cloudwatch_log_group" "this" {
  name              = "/aws/apigateway/${var.name}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = var.throttling_burst_limit
    throttling_rate_limit  = var.throttling_rate_limit
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.this.arn
    format = jsonencode({
      requestId = "$context.requestId"
      ip        = "$context.identity.sourceIp"
      method    = "$context.httpMethod"
      path      = "$context.path"
      status    = "$context.status"
      latency   = "$context.integrationLatency"
    })
  }

  tags = var.tags
}

resource "aws_apigatewayv2_integration" "this" {
  for_each = var.integrations

  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_uri        = each.value.invoke_arn
  payload_format_version = "1.0"
  timeout_milliseconds   = 29000
}

resource "aws_apigatewayv2_route" "this" {
  for_each = local.routes

  api_id    = aws_apigatewayv2_api.this.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.this[each.value].id}"
}

resource "aws_lambda_permission" "this" {
  for_each = var.integrations

  statement_id  = "AllowHttpApiInvoke"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}
