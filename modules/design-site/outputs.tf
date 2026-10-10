output "website_endpoint" {
  value = module.s3_bucket.s3_bucket_website_endpoint
}

output "codebuild_project" {
  value = aws_codebuild_project.design.name
}
