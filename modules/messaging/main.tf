# =============================================================
# 📨 Bus de EventBridge + colas SQS (con DLQ) alimentadas por reglas
#    + identidad de SES opcional para el envío de correos
# =============================================================

resource "aws_cloudwatch_event_bus" "this" {
  name = var.event_bus_name
  tags = var.tags
}

resource "aws_sqs_queue" "dlq" {
  for_each = var.queues

  name                      = "${var.name_prefix}-${each.key}-dlq"
  message_retention_seconds = 1209600 # 14 días
  tags                      = var.tags
}

resource "aws_sqs_queue" "this" {
  for_each = var.queues

  name                       = "${var.name_prefix}-${each.key}"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = 345600

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[each.key].arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = var.tags
}

resource "aws_cloudwatch_event_rule" "this" {
  for_each = var.queues

  name           = "${var.name_prefix}-${each.key}"
  event_bus_name = aws_cloudwatch_event_bus.this.name
  event_pattern  = each.value.event_pattern
  tags           = var.tags
}

resource "aws_cloudwatch_event_target" "this" {
  for_each = var.queues

  rule           = aws_cloudwatch_event_rule.this[each.key].name
  event_bus_name = aws_cloudwatch_event_bus.this.name
  arn            = aws_sqs_queue.this[each.key].arn
}

data "aws_iam_policy_document" "queue" {
  for_each = var.queues

  statement {
    effect    = "Allow"
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.this[each.key].arn]

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [aws_cloudwatch_event_rule.this[each.key].arn]
    }
  }
}

resource "aws_sqs_queue_policy" "this" {
  for_each = var.queues

  queue_url = aws_sqs_queue.this[each.key].id
  policy    = data.aws_iam_policy_document.queue[each.key].json
}

resource "aws_ses_email_identity" "sender" {
  count = var.ses_sender_email == "" ? 0 : 1
  email = var.ses_sender_email
}
