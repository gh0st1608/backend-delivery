output "project_name" {
  value = aws_codebuild_project.this.name
}

output "role_name" {
  value = aws_iam_role.this.name
}
