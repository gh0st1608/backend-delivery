resource "aws_codebuild_project" "design" {
  name          = "build-design-foodstore"
  description   = ""
  build_timeout = 15
  service_role  = "arn:aws:iam::248268265208:role/service-role/codebuild-build-design-foodstore-service-role"

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
      status     = "ENABLED"
      group_name = ""
      stream_name = ""
    }
    s3_logs {
      status = "DISABLED"
    }
  }

  source {
    type            = "GITHUB"
    location        = "https://github.com/gh0st1608/backend-delivery"
    buildspec       = "api/deploy/buildspec.yaml"
    git_clone_depth = 1

    git_submodules_config {
      fetch_submodules = false
    }
  }
}

resource "aws_codebuild_webhook" "design" {
  project_name = aws_codebuild_project.design.name

  filter_group {
    filter {
      type    = "EVENT"
      pattern = "PUSH"
    }

    filter {
      type    = "HEAD_REF"
      pattern = "^refs/heads/design$"
    }
  }
}

