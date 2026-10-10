# =============================================================
# 🚀 CodeBuild que despliega un microservicio en Lambda
# -------------------------------------------------------------
# Cada push a la rama ejecuta el buildspec.yml del servicio, que sube
# lambda.zip a S3 y hace `aws lambda update-function-code`.
# S3_BUCKET / ZIP_KEY / LAMBDA_NAME se fijan en el proyecto: tienen
# prioridad sobre los valores del buildspec.
# =============================================================

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["codebuild.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "this" {
  name               = "codebuild-${var.name}-service-role"
  assume_role_policy = data.aws_iam_policy_document.assume.json
  tags               = var.tags
}

resource "aws_iam_role_policy" "this" {
  name = "codebuild-${var.name}-policy"
  role = aws_iam_role.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/${var.name}*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = "arn:aws:s3:::${var.artifacts_bucket}"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = "arn:aws:s3:::${var.artifacts_bucket}/${var.zip_key}"
      },
      {
        Effect   = "Allow"
        Action   = ["lambda:GetFunction", "lambda:UpdateFunctionCode"]
        Resource = var.lambda_function_arn
      },
    ]
  })
}

resource "aws_codebuild_project" "this" {
  name          = var.name
  description   = var.description
  build_timeout = 15
  service_role  = aws_iam_role.this.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    compute_type                = var.compute_type
    image                       = var.image
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "S3_BUCKET"
      value = var.artifacts_bucket
    }
    environment_variable {
      name  = "ZIP_KEY"
      value = var.zip_key
    }
    environment_variable {
      name  = "LAMBDA_NAME"
      value = var.lambda_function_name
    }
  }

  logs_config {
    cloudwatch_logs {
      status = "ENABLED"
    }
  }

  source {
    type            = "GITHUB"
    location        = var.repository_url
    buildspec       = var.buildspec
    git_clone_depth = 1
  }

  source_version = var.branch

  tags = var.tags
}

resource "aws_codebuild_webhook" "this" {
  project_name = aws_codebuild_project.this.name
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
