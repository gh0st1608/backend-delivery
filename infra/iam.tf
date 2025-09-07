resource "aws_iam_role" "codebuild_service_role" {
  name = "codebuild-build-design-foodstore-service-role"
  assume_role_policy = data.aws_iam_policy_document.codebuild_assume.json
}

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

resource "aws_iam_role_policy" "codebuild_s3_policy" {
  name = "codebuild-s3-upload"
  role = aws_iam_role.codebuild_service_role.name # ajusta al nombre/ARN de tu rol existente

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::foodstore-design",
          "arn:aws:s3:::foodstore-design/*"
        ]
      }
    ]
  })
}

