#!/usr/bin/env bash
# =============================================================
# Detiene lo que levantó up.sh.
#
# Uso:
#   ./down.sh          # detiene backends, simulador y frontend
#   ./down.sh --all    # además detiene LocalStack (sus datos se pierden:
#                      # el próximo up.sh recrea la infraestructura)
# =============================================================
set -uo pipefail

LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "$LOCAL_DIR/.." && pwd)"
# shellcheck source=scripts/procs.sh
source "$LOCAL_DIR/scripts/procs.sh"

ALL=false
[ "${1:-}" = "--all" ] && ALL=true

# Vigilantes (nest --watch), apps, Expo y simulador, identificados por su
# línea de comando: así no quedan vigilantes huérfanos que relancen la app.
for name in auth notification shop checkout order payment courier-sim expo; do
  n=$(proc_stop "$name" | tr -d '\r ')
  [ "${n:-0}" != 0 ] && echo "  detenido: $name ($n proceso(s))"
done

sleep 2
left=0
for name in auth notification shop checkout order payment courier-sim expo; do
  n=$(proc_count "$name" | tr -d '\r ')
  [ "${n:-0}" != 0 ] && { echo "  ⚠ $name sigue con $n proceso(s)"; left=1; }
done

# Restos de la versión anterior de los scripts
rm -f "$LOCAL_DIR"/.run/*.pid

if $ALL; then
  docker compose -f "$INFRA_DIR/localstack/docker-compose.yml" down >/dev/null 2>&1 && echo "  LocalStack detenido"
  # LocalStack Community no persiste datos: el estado de Terraform queda obsoleto
  rm -f "$INFRA_DIR/environments/dev/terraform.tfstate" "$INFRA_DIR/environments/dev/terraform.tfstate.backup"
  echo "  estado de Terraform dev reiniciado"
fi

[ "$left" = 0 ] && echo "✔ Entorno local detenido" || { echo "✖ Quedaron procesos vivos (ver arriba)"; exit 1; }
