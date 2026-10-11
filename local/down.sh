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
RUN_DIR="$LOCAL_DIR/.run"

ALL=false
[ "${1:-}" = "--all" ] && ALL=true

is_windows() { case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) return 0 ;; *) return 1 ;; esac; }

kill_tree() { # kill_tree <pid>
  if is_windows; then taskkill //F //T //PID "$1" >/dev/null 2>&1
  else pkill -TERM -P "$1" 2>/dev/null; kill -TERM "$1" 2>/dev/null; fi
}

pid_on_port() { # pid_on_port <puerto>
  if is_windows; then netstat -ano | grep LISTENING | grep -E "[:.]$1 " | awk '{print $NF}' | head -1
  else lsof -ti "tcp:$1" -sTCP:LISTEN 2>/dev/null | head -1; fi
}

# 1) Procesos lanzados por up.sh (PID guardado)
for pidfile in "$RUN_DIR"/*.pid; do
  [ -e "$pidfile" ] || continue
  name=$(basename "$pidfile" .pid)
  kill_tree "$(cat "$pidfile")" && echo "  detenido: $name"
  rm -f "$pidfile"
done

# 2) Respaldo: lo que siga escuchando en los puertos del entorno
for port in 3000 3001 3002 3003 3004 3005 8081; do
  pid=$(pid_on_port "$port")
  [ -n "$pid" ] && [ "$pid" != "0" ] && kill_tree "$pid" && echo "  liberado puerto $port (PID $pid)"
done

if $ALL; then
  docker compose -f "$INFRA_DIR/localstack/docker-compose.yml" down >/dev/null 2>&1 && echo "  LocalStack detenido"
  # LocalStack Community no persiste datos: el estado de Terraform queda obsoleto
  rm -f "$INFRA_DIR/environments/dev/terraform.tfstate" "$INFRA_DIR/environments/dev/terraform.tfstate.backup"
  echo "  estado de Terraform dev reiniciado"
fi

echo "✔ Entorno local detenido"
