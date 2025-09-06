resource "aws_codebuild_project" "design" {
  name          = "build-design-foodstore"
  description   = "CodeBuild project for design pipeline"
  build_timeout = 5

  service_role = "arn:aws:iam::248268265208:role/service-role/codebuild-foodstore-build-service-role"

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
  }

  source {
    type            = "GITHUB"
    location        = "https://github.com/gh0st1608/backend-delivery.git"
    buildspec       = "api/deploy/buildspec.yaml"
    git_clone_depth = 1
  }
}
