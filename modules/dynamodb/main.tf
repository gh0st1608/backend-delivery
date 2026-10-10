# =============================================================
# 🗄️ Tablas DynamoDB (on-demand) a partir de un mapa de definiciones
# =============================================================

resource "aws_dynamodb_table" "this" {
  for_each = var.tables

  name                        = each.key
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = each.value.hash_key
  range_key                   = each.value.range_key
  deletion_protection_enabled = var.deletion_protection

  dynamic "attribute" {
    for_each = each.value.attributes
    content {
      name = attribute.key
      type = attribute.value
    }
  }

  dynamic "global_secondary_index" {
    for_each = each.value.indexes
    content {
      name            = global_secondary_index.value.name
      hash_key        = global_secondary_index.value.hash_key
      range_key       = global_secondary_index.value.range_key
      projection_type = "ALL"
    }
  }

  dynamic "ttl" {
    for_each = each.value.ttl_attribute == null ? [] : [each.value.ttl_attribute]
    content {
      attribute_name = ttl.value
      enabled        = true
    }
  }

  point_in_time_recovery {
    enabled = var.point_in_time_recovery
  }

  tags = merge(var.tags, each.value.owner == null ? {} : { Service = each.value.owner })
}
