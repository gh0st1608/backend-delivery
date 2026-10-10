# =============================================================
# 📝 Genera un archivo .env por clave del mapa `files`
# =============================================================

resource "local_file" "this" {
  for_each = var.files

  filename        = "${var.directory}/${each.key}.env"
  file_permission = "0644"
  content = join("\n", concat(
    [var.header],
    [for k, v in merge(var.common, each.value) : "${k}=${v}"],
    [""],
  ))
}
