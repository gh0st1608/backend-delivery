module "s3_bucket" {
  source = "terraform-aws-modules/s3-bucket/aws"
  version = "4.1.2"

  bucket = "my-s3-bucket"
  acl    = "public-read"

  control_object_ownership = true
  object_ownership         = "ObjectWriter"

  versioning = {
    enabled = true
  }

  # 🔹 habilitar hosting de sitio estático
  website = {
    index_document = "index.html"
    error_document = "error.html"
  }

  # 🔹 política pública opcional para servir archivos
  attach_policy = true
  policy        = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action   = "s3:GetObject"
        Resource = "arn:aws:s3:::my-s3-bucket/*"
      }
    ]
  })
}

# 🔹 Output con la URL del sitio
output "s3_bucket_website_endpoint" {
  value = module.s3_bucket.s3_bucket_website_endpoint
}
