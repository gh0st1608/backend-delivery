variable "aws_region" {
  type = string
}

variable "event_bus_name" {
  type        = string
  description = "Valor de EVENT_BUS_NAME en los servicios"
}

variable "shop_base_url" {
  type        = string
  description = "URL base de backend-shop incluyendo /shop (SHOP_MS_BASE_URL)"
}

variable "order_base_url" {
  type        = string
  description = "URL base de backend-order incluyendo /order (ORDER_MS_BASE_URL)"
}

variable "ses_sender_email" {
  type    = string
  default = ""
}

variable "assignment_retry_schedule" {
  type    = string
  default = "rate(1 minute)"
}

variable "app_config" {
  type = object({
    cors_origins                = optional(string, "")
    jwt_issuer                  = optional(string, "foodstore-auth")
    jwt_audience                = optional(string, "foodstore-api")
    paypal_env                  = optional(string, "sandbox")
    payment_allowed_return_urls = optional(string, "")
    refresh_cookie_secure       = optional(string, "true")
    refresh_cookie_samesite     = optional(string, "strict")
    # Variables extra por servicio: { order = { DEFAULT_DELIVERY_FEE_CLP = "2490" } }
    extra_env = optional(map(map(string)), {})
  })
  default = {}
}

variable "secrets" {
  type = object({
    jwt_private_key      = optional(string, "")
    jwt_public_key       = optional(string, "")
    internal_api_key     = optional(string, "")
    paypal_client_id     = optional(string, "")
    paypal_client_secret = optional(string, "")
  })
  default   = {}
  sensitive = true
}
