# 🔹 Rol de CodeBuild
resource "aws_iam_role" "codebuild_service_role" {
  name               = "codebuild-build-design-foodstore-service-role"
  assume_role_policy = data.aws_iam_policy_document.codebuild_assume.json
}

# 🔹 Trust policy: permitir que CodeBuild asuma el rol
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

# =============================
# 📦 POLÍTICA S3
# =============================
resource "aws_iam_policy" "codebuild_s3_policy" {
  name        = "CodeBuildS3Policy-foodstore-design"
  description = "Permisos de CodeBuild para acceder al bucket S3 foodstore-design"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = "arn:aws:s3:::foodstore-design"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "arn:aws:s3:::foodstore-design/*"
      }
    ]
  })
}

# =============================
# 📜 POLÍTICA LOGS
# =============================
data "aws_caller_identity" "current" {}

resource "aws_iam_policy" "codebuild_logs_policy" {
  name        = "CodeBuildLogsPolicy-foodstore-design"
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
        Resource = "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/build-design-foodstore*"
      }
    ]
  })
}

# =============================
# 🔗 Attach policies al rol
# =============================
resource "aws_iam_role_policy_attachment" "codebuild_attach_s3" {
  role       = aws_iam_role.codebuild_service_role.name
  policy_arn = aws_iam_policy.codebuild_s3_policy.arn
}

resource "aws_iam_role_policy_attachment" "codebuild_attach_logs" {
  role       = aws_iam_role.codebuild_service_role.name
  policy_arn = aws_iam_policy.codebuild_logs_policy.arn
}
