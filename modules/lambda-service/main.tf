# =============================================================
# λ Lambda de un microservicio NestJS
# -------------------------------------------------------------
# Terraform crea la función con un código "placeholder"; el código
# real lo publica CodeBuild (buildspec.yml de cada servicio) con
# `aws lambda update-function-code`. Por eso se ignoran los cambios
# de código en el ciclo de vida.
# =============================================================

data "archive_file" "placeholder" {
  type        = "zip"
  output_path = "${path.root}/.build/${var.name}-placeholder.zip"

  source {
    filename = "handler.js"
    content  = <<-JS
      exports.handler = async () => ({
        statusCode: 503,
        body: JSON.stringify({ message: "${var.name}: pendiente de despliegue (CodeBuild)" }),
      });
    JS
  }
}

# =============================
# 🔐 IAM
# =============================
data "aws_iam_policy_document" "assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "this" {
  name               = "${var.name}-role"
  assume_role_policy = data.aws_iam_policy_document.assume.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "basic" {
  role       = aws_iam_role.this.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

locals {
  has_policy = (
    length(var.dynamodb_table_arns) > 0 ||
    var.publish_events ||
    length(var.sqs_triggers) > 0 ||
    var.allow_ses_send
  )
}

data "aws_iam_policy_document" "this" {
  dynamic "statement" {
    for_each = length(var.dynamodb_table_arns) > 0 ? [1] : []
    content {
      sid    = "DynamoDB"
      effect = "Allow"
      actions = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:ConditionCheckItem",
      ]
      resources = flatten([for arn in var.dynamodb_table_arns : [arn, "${arn}/index/*"]])
    }
  }

  dynamic "statement" {
    for_each = var.publish_events ? [1] : []
    content {
      sid       = "EventBridge"
      effect    = "Allow"
      actions   = ["events:PutEvents"]
      resources = [var.event_bus_arn]
    }
  }

  dynamic "statement" {
    for_each = length(var.sqs_triggers) > 0 ? [1] : []
    content {
      sid    = "SQSConsume"
      effect = "Allow"
      actions = [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:ChangeMessageVisibility",
      ]
      resources = [for t in values(var.sqs_triggers) : t.queue_arn]
    }
  }

  dynamic "statement" {
    for_each = var.allow_ses_send ? [1] : []
    content {
      sid       = "SES"
      effect    = "Allow"
      actions   = ["ses:SendEmail", "ses:SendRawEmail"]
      resources = ["*"]
    }
  }
}

resource "aws_iam_role_policy" "this" {
  count = local.has_policy ? 1 : 0

  name   = "${var.name}-policy"
  role   = aws_iam_role.this.id
  policy = data.aws_iam_policy_document.this.json
}

# =============================
# λ Función
# =============================
resource "aws_cloudwatch_log_group" "this" {
  name              = "/aws/lambda/${var.name}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

resource "aws_lambda_function" "this" {
  function_name = var.name
  description   = var.description
  role          = aws_iam_role.this.arn
  runtime       = var.runtime
  handler       = var.handler
  memory_size   = var.memory_size
  timeout       = var.timeout
  architectures = ["x86_64"]

  filename         = data.archive_file.placeholder.output_path
  source_code_hash = data.archive_file.placeholder.output_base64sha256

  environment {
    variables = var.environment
  }

  tags = var.tags

  depends_on = [
    aws_iam_role_policy_attachment.basic,
    aws_cloudwatch_log_group.this,
  ]

  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash,
      s3_bucket,
      s3_key,
      s3_object_version,
    ]
  }
}

# =============================
# 📥 Disparadores SQS
# =============================
resource "aws_lambda_event_source_mapping" "sqs" {
  for_each = var.sqs_triggers

  event_source_arn        = each.value.queue_arn
  function_name           = aws_lambda_function.this.arn
  batch_size              = each.value.batch_size
  function_response_types = each.value.report_batch_item_failures ? ["ReportBatchItemFailures"] : []

  depends_on = [aws_iam_role_policy.this]
}

# =============================
# ⏰ Invocación programada (EventBridge, bus por defecto)
# =============================
resource "aws_cloudwatch_event_rule" "schedule" {
  count = var.schedule_expression == null ? 0 : 1

  name                = "${var.name}-schedule"
  schedule_expression = var.schedule_expression
  tags                = var.tags
}

resource "aws_cloudwatch_event_target" "schedule" {
  count = var.schedule_expression == null ? 0 : 1

  rule = aws_cloudwatch_event_rule.schedule[0].name
  arn  = aws_lambda_function.this.arn
}

resource "aws_lambda_permission" "schedule" {
  count = var.schedule_expression == null ? 0 : 1

  statement_id  = "AllowEventBridgeSchedule"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.schedule[0].arn
}
