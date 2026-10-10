# =============================================================
# 🎨 Sitio estático de diseño: bucket S3 público + CodeBuild
# -------------------------------------------------------------
# Recursos que existían en infra/ (cloudbuild.tf, iam.tf, s3.tf).
# Se mantienen los mismos nombres de recurso para que los bloques
# `moved` del entorno los adopten sin recrearlos.
# =============================================================

data "aws_caller_identity" "current" {}

# =============================
# 🪣 Bucket del sitio
# =============================
module "s3_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "4.1.2"

  bucket = var.bucket_name
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

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false

  # 🔹 política pública para servir archivos
  attach_policy = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "arn:aws:s3:::${var.bucket_name}/*"
      }
    ]
  })
}

# =============================
# 🔹 Rol de CodeBuild
# =============================
data "aws_iam_policy_document" "codebuild_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["codebuild.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "codebuild_service_role" {
  name               = "codebuild-${var.project_name}-service-role"
  assume_role_policy = data.aws_iam_policy_document.codebuild_assume.json
}

resource "aws_iam_policy" "codebuild_s3_policy" {
  name        = "CodeBuildS3Policy-${var.bucket_name}"
  description = "Permisos de CodeBuild para acceder al bucket S3 ${var.bucket_name}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = "arn:aws:s3:::${var.bucket_name}"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "arn:aws:s3:::${var.bucket_name}/*"
      }
    ]
  })
}

resource "aws_iam_policy" "codebuild_logs_policy" {
  name        = "CodeBuildLogsPolicy-${var.bucket_name}"
  description = "Permisos de CodeBuild para escribir logs en CloudWatch"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/${var.project_name}*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "codebuild_attach_s3" {
  role       = aws_iam_role.codebuild_service_role.name
  policy_arn = aws_iam_policy.codebuild_s3_policy.arn
}

resource "aws_iam_role_policy_attachment" "codebuild_attach_logs" {
  role       = aws_iam_role.codebuild_service_role.name
  policy_arn = aws_iam_policy.codebuild_logs_policy.arn
}

# =============================
# 🚀 CodeBuild + webhook
# =============================
resource "aws_codebuild_project" "design" {
  name          = var.project_name
  description   = "Compila y despliega el diseño en S3"
  build_timeout = 15
  service_role  = aws_iam_role.codebuild_service_role.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  cache {
    type = "NO_CACHE"
  }

  environment {
    compute_type                = "BUILD_LAMBDA_4GB"
    image                       = "aws/codebuild/amazonlinux-x86_64-lambda-standard:nodejs20"
    type                        = "LINUX_LAMBDA_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = false
  }

  logs_config {
    cloudwatch_logs {
      status      = "ENABLED"
      group_name  = ""
      stream_name = ""
    }
    s3_logs {
      status = "DISABLED"
    }
  }

  source {
    type            = "GITHUB"
    location        = var.repository_url
    buildspec       = var.buildspec
    git_clone_depth = 1

    git_submodules_config {
      fetch_submodules = false
    }
  }
}

resource "aws_codebuild_webhook" "design" {
  project_name = aws_codebuild_project.design.name
  build_type   = "BUILD"

  filter_group {
    filter {
      type    = "EVENT"
      pattern = "PUSH"
    }

    filter {
      type    = "HEAD_REF"
      pattern = "^refs/heads/${var.branch}$"
    }
  }
}
