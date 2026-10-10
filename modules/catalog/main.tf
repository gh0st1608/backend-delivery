# =============================================================
# 🧩 Catálogo del backend FoodStore (no crea recursos)
# -------------------------------------------------------------
# Única fuente de verdad de lo que necesita cada microservicio:
# tablas, colas/eventos, rutas HTTP y variables de entorno.
# Los entornos lo consumen y pasan sus salidas a los módulos
# de recursos (dynamodb, messaging, lambda-service, ...).
# =============================================================

locals {
  # ---------------------------------------------------------
  # 🗄️ Tablas DynamoDB
  # Nombres fijos en el código (ej. `tableName = 'Users'`).
  # Claves e índices según src/infrastructure/**/repository*.
  # ---------------------------------------------------------
  tables = {
    # auth
    Users = {
      owner      = "auth"
      hash_key   = "userId"
      attributes = { userId = "S", email = "S", GSI1PK = "S", GSI1SK = "S" }
      indexes = [
        { name = "EmailIndex", hash_key = "email", range_key = null },
        { name = "GSI_USER", hash_key = "GSI1PK", range_key = "GSI1SK" },
      ]
      ttl_attribute = null
    }
    Preferences = {
      owner      = "auth"
      hash_key   = "preferenceId"
      attributes = { preferenceId = "S", GSI1PK = "S", GSI1SK = "S" }
      indexes = [
        { name = "GSI_USER", hash_key = "GSI1PK", range_key = "GSI1SK" },
      ]
      ttl_attribute = null
    }
    RefreshTokens = {
      owner      = "auth"
      hash_key   = "tokenHash"
      attributes = { tokenHash = "S", familyId = "S" }
      indexes = [
        { name = "GSI_FAMILY", hash_key = "familyId", range_key = null },
      ]
      ttl_attribute = "ttl"
    }

    # shop
    Products = {
      owner      = "shop"
      hash_key   = "productId"
      attributes = { productId = "S", GSI1PK = "S", GSI1SK = "S" }
      indexes = [
        { name = "GSI_CATEGORY", hash_key = "GSI1PK", range_key = "GSI1SK" },
      ]
      ttl_attribute = null
    }
    Categories = {
      owner         = "shop"
      hash_key      = "categoryId"
      attributes    = { categoryId = "S" }
      indexes       = []
      ttl_attribute = null
    }

    # checkout: borra con Key { userId } → un carrito por usuario
    Carts = {
      owner      = "checkout"
      hash_key   = "userId"
      attributes = { userId = "S" }
      indexes = [
        { name = "GSI_UserId", hash_key = "userId", range_key = null },
      ]
      ttl_attribute = null
    }

    # order
    Orders = {
      owner      = "order"
      hash_key   = "orderId"
      attributes = { orderId = "S", GSI1PK = "S", GSI1SK = "S" }
      indexes = [
        { name = "GSI_ORDER", hash_key = "GSI1PK", range_key = "GSI1SK" },
      ]
      ttl_attribute = null
    }
    Couriers = {
      owner      = "order"
      hash_key   = "courierId"
      attributes = { courierId = "S", GSI1PK = "S", GSI1SK = "S" }
      indexes = [
        { name = "GSI_COURIER", hash_key = "GSI1PK", range_key = "GSI1SK" },
      ]
      ttl_attribute = null
    }
    Settings = {
      owner         = "order"
      hash_key      = "settingKey"
      attributes    = { settingKey = "S" }
      indexes       = []
      ttl_attribute = null
    }

    # payment
    Payments = {
      owner      = "payment"
      hash_key   = "paymentId"
      attributes = { paymentId = "S", GSI1PK = "S", GSI1SK = "S", GSI2PK = "S", GSI2SK = "S" }
      indexes = [
        { name = "GSI_PAYMENT", hash_key = "GSI1PK", range_key = "GSI1SK" },
        { name = "GSI_PROVIDER_TOKEN", hash_key = "GSI2PK", range_key = "GSI2SK" },
      ]
      ttl_attribute = null
    }
  }

  # ---------------------------------------------------------
  # 📨 Colas SQS alimentadas por reglas de EventBridge
  # ---------------------------------------------------------
  queues = {
    notification-email = {
      consumer = "notification"
      event_pattern = jsonencode({
        source        = ["auth-service"]
        "detail-type" = ["EmailVerificationRequested"]
      })
      # El handler de notification no devuelve fallos parciales
      report_batch_item_failures = false
    }
    order-events = {
      consumer = "order"
      event_pattern = jsonencode({
        source        = ["payment-service"]
        "detail-type" = ["PaymentApproved"]
      })
      # handler.ts de order devuelve batchItemFailures
      report_batch_item_failures = true
    }
  }

  # ---------------------------------------------------------
  # λ Microservicios
  # ---------------------------------------------------------
  services = {
    auth = {
      description      = "Registro, login, verificación de correo y preferencias"
      memory_size      = 512
      publishes_events = true
      sends_email      = false
      http_prefixes    = ["auth"]
      schedule         = null
    }
    shop = {
      description      = "Catálogo de productos y categorías"
      memory_size      = 512
      publishes_events = false
      sends_email      = false
      http_prefixes    = ["shop"]
      schedule         = null
    }
    checkout = {
      description      = "Carrito de compras"
      memory_size      = 512
      publishes_events = true
      sends_email      = false
      http_prefixes    = ["checkout"]
      schedule         = null
    }
    order = {
      description      = "Pedidos, repartidores y asignación automática"
      memory_size      = 1024
      publishes_events = true
      sends_email      = false
      http_prefixes    = ["order", "courier"]
      # Reintento de asignación de repartidores pendientes
      schedule = var.assignment_retry_schedule
    }
    payment = {
      description      = "Pagos (PayPal)"
      memory_size      = 512
      publishes_events = true
      sends_email      = false
      http_prefixes    = ["payment"]
      schedule         = null
    }
    notification = {
      description      = "Envío de correos (SQS -> SES)"
      memory_size      = 256
      publishes_events = false
      sends_email      = true
      http_prefixes    = []
      schedule         = null
    }
  }

  # ---------------------------------------------------------
  # ⚙️ Variables de entorno NO secretas (.env.example de cada servicio)
  # ---------------------------------------------------------
  jwt_env = {
    JWT_ISSUER   = var.app_config.jwt_issuer
    JWT_AUDIENCE = var.app_config.jwt_audience
    CORS_ORIGINS = var.app_config.cors_origins
  }

  base_env = {
    auth = merge(local.jwt_env, {
      EVENT_BUS_NAME                   = var.event_bus_name
      REFRESH_TOKEN_TABLE              = "RefreshTokens"
      ACCESS_TOKEN_TTL_SECONDS         = "900"
      REFRESH_TOKEN_TTL_SECONDS        = "604800"
      REFRESH_TOKEN_FAMILY_MAX_SECONDS = "2592000"
      REFRESH_COOKIE_SECURE            = var.app_config.refresh_cookie_secure
      REFRESH_COOKIE_SAMESITE          = var.app_config.refresh_cookie_samesite
    })
    shop = merge(local.jwt_env, {
      EVENT_BUS_NAME = var.event_bus_name
    })
    checkout = merge(local.jwt_env, {
      EVENT_BUS_NAME = var.event_bus_name
      CART_TABLE     = "Carts"
    })
    order = merge(local.jwt_env, {
      EVENT_BUS_NAME                        = var.event_bus_name
      ORDER_TABLE                           = "Orders"
      SETTINGS_TABLE                        = "Settings"
      SHOP_MS_BASE_URL                      = var.shop_base_url
      EXCHANGE_RATE_API_URL                 = "https://mindicador.cl/api/dolar"
      DEFAULT_DELIVERY_FEE_CLP              = "1990"
      DEFAULT_USD_CLP_RATE                  = "950"
      EXCHANGE_RATE_CACHE_TTL_SECONDS       = "3600"
      COURIER_MAX_LOCATION_AGE_SECONDS      = "120"
      COURIER_AUTO_ASSIGN_MAX_CANDIDATES    = "25"
      COURIER_MAX_PICKUP_DISTANCE_KM        = "10"
      COURIER_ASSIGN_RETRY_INTERVAL_SECONDS = "30"
      COURIER_ASSIGN_MAX_ATTEMPTS           = "20"
    })
    payment = merge(local.jwt_env, {
      EVENT_BUS_NAME              = var.event_bus_name
      PAYPAL_ENV                  = var.app_config.paypal_env
      ORDER_MS_BASE_URL           = var.order_base_url
      PAYMENT_ALLOWED_RETURN_URLS = var.app_config.payment_allowed_return_urls
    })
    notification = {
      # notification lee REGION (no AWS_REGION)
      REGION           = var.aws_region
      SES_SOURCE_EMAIL = var.ses_sender_email
    }
  }

  service_env = {
    for svc, env in local.base_env :
    svc => merge(env, lookup(var.app_config.extra_env, svc, {}))
  }

  # ---------------------------------------------------------
  # 🔐 Variables secretas (solo para Lambdas)
  # ---------------------------------------------------------
  jwt_secret_env = {
    JWT_PUBLIC_KEY   = var.secrets.jwt_public_key
    INTERNAL_API_KEY = var.secrets.internal_api_key
  }

  secret_env = {
    auth     = merge(local.jwt_secret_env, { JWT_PRIVATE_KEY = var.secrets.jwt_private_key })
    shop     = local.jwt_secret_env
    checkout = local.jwt_secret_env
    order    = local.jwt_secret_env
    payment = merge(local.jwt_secret_env, {
      PAYPAL_CLIENT_ID     = var.secrets.paypal_client_id
      PAYPAL_CLIENT_SECRET = var.secrets.paypal_client_secret
    })
    notification = {}
  }
}
