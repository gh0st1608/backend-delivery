output "files" {
  value = [for f in local_file.this : f.filename]
}
