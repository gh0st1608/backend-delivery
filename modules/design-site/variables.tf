variable "aws_region" {
  type = string
}

variable "bucket_name" {
  type    = string
  default = "foodstore-design"
}

variable "project_name" {
  type    = string
  default = "build-design-foodstore"
}

variable "repository_url" {
  type = string
}

variable "branch" {
  type    = string
  default = "design"
}

variable "buildspec" {
  type    = string
  default = "api/deploy/buildspec.yaml"
}
