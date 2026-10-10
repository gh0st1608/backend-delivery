variable "name" {
  type        = string
  description = "Nombre del proyecto CodeBuild"
}

variable "description" {
  type    = string
  default = ""
}

variable "aws_region" {
  type = string
}

variable "repository_url" {
  type = string
}

variable "branch" {
  type        = string
  description = "Rama cuyo push dispara el build"
}

variable "buildspec" {
  type    = string
  default = "buildspec.yml"
}

variable "artifacts_bucket" {
  type = string
}

variable "zip_key" {
  type = string
}

variable "lambda_function_name" {
  type = string
}

variable "lambda_function_arn" {
  type = string
}

variable "compute_type" {
  type    = string
  default = "BUILD_GENERAL1_SMALL"
}

variable "image" {
  type    = string
  default = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
}

variable "tags" {
  type    = map(string)
  default = {}
}
