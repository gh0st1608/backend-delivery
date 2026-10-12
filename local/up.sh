#!/usr/bin/env bash
# =============================================================
# Levanta todo FoodStore en local con un comando:
#   LocalStack + infraestructura (Terraform dev) + 6 backends +
#   datos de prueba + simulador de repartidor + frontend (Expo).
#
# Uso:
#   ./up.sh            # frontend web en http://localhost:8081
#   ./up.sh --lan      # frontend para Expo Go en un celular de la misma red
#   ./up.sh --no-front # solo infraestructura y backends
#   ./up.sh --e2e      # al final ejecuta la prueba E2E del backend
#
# Variables opcionales:
#   BACKEND_DIR   carpeta con los worktrees backend-* (por defecto: ../..)
#   FRONTEND_DIR  repo frontend-delivery (por defecto: $BACKEND_DIR/../frontend-delivery)
#   LAN_HOST      IP a usar con --lan (por defecto se detecta)
#
# Es re-ejecutable: lo que ya está corriendo no se vuelve a lanzar.
# Para detener todo: ./down.sh
# =============================================================
set -euo pipefail

LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "$LOCAL_DIR/.." && pwd)"
BACKEND_DIR="${BACKEND_DIR:-$(cd "$INFRA_DIR/.." && pwd)}"
FRONTEND_DIR="${FRONTEND_DIR:-$(cd "$BACKEND_DIR/.." && pwd)/frontend-delivery}"
RUN_DIR="$LOCAL_DIR/.run"
LOG_DIR="$RUN_DIR/logs"
mkdir -p "$LOG_DIR"

MODE=web
FRONT=true
E2E=false
for arg in "$@"; do
  case "$arg" in
    --lan) MODE=lan ;;
    --no-front) FRONT=false ;;
    --e2e) E2E=true ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "Opción desconocida: $arg"; exit 1 ;;
  esac
done

SERVICES=(auth notification shop checkout order payment)
declare -A PORT=([auth]=3000 [notification]=3001 [shop]=3002 [checkout]=3003 [order]=3004 [payment]=3005)

step() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
info() { printf '  %s\n' "$*"; }
fail() { printf '\n\033[1;31m✖ %s\033[0m\n' "$*"; exit 1; }

is_windows() { case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) return 0 ;; *) return 1 ;; esac; }

port_open() {
  if is_windows; then netstat -ano 2>/dev/null | grep -q "LISTENING" && netstat -ano | grep LISTENING | grep -qE "[:.]$1 "
  else (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; fi
}

wait_for() { # wait_for <descripción> <segundos> <comando...>
  local desc=$1 secs=$2; shift 2
  for _ in $(seq 1 "$secs"); do "$@" && return 0; sleep 1; done
  fail "Tiempo agotado esperando: $desc"
}

# shellcheck source=scripts/procs.sh
source "$LOCAL_DIR/scripts/procs.sh"

# Lanza un proceso desacoplado de esta terminal
spawn() { # spawn <nombre> <dir> <comando...>
  local name=$1 dir=$2; shift 2
  ( cd "$dir" && exec nohup "$@" > "$LOG_DIR/$name.log" 2>&1 < /dev/null ) &
}

# Un componente está sano si escucha en su puerto y tiene un único vigilante.
# Si no, se limpian sus procesos (huérfanos o duplicados) para arrancar de cero.
ensure_clean() { # ensure_clean <componente> <puerto>
  local name=$1 port=$2 watchers
  watchers=$(proc_count "$name" watchers | tr -d '\r ')
  if port_open "$port" && [ "$watchers" = 1 ]; then return 0; fi
  if [ "$(proc_count "$name" | tr -d '\r ')" != 0 ]; then
    info "$name: $(proc_stop "$name" | tr -d '\r ') proceso(s) huérfanos o duplicados detenidos"
    sleep 2
  fi
  return 1
}

# Nada de lo que se lance debe usar credenciales reales de AWS
unset AWS_PROFILE AWS_DEFAULT_PROFILE

# -------------------------------------------------------------
step "1/7 Requisitos"
for cmd in docker terraform node npm curl; do
  command -v "$cmd" >/dev/null || fail "Falta '$cmd' en el PATH"
done
docker info >/dev/null 2>&1 || fail "Docker no está corriendo"
for svc in "${SERVICES[@]}"; do
  [ -d "$BACKEND_DIR/backend-$svc" ] || fail "No existe $BACKEND_DIR/backend-$svc (worktree de la rama del servicio)"
  [ -d "$BACKEND_DIR/backend-$svc/node_modules" ] || { info "npm install en backend-$svc..."; (cd "$BACKEND_DIR/backend-$svc" && npm install --no-audit --no-fund >/dev/null); }
done
if $FRONT; then
  [ -d "$FRONTEND_DIR" ] || fail "No existe el frontend en $FRONTEND_DIR (usa FRONTEND_DIR=...)"
  [ -d "$FRONTEND_DIR/node_modules" ] || { info "npm install en frontend..."; (cd "$FRONTEND_DIR" && npm install --no-audit --no-fund >/dev/null); }
fi
info "OK (backend: $BACKEND_DIR)"

# -------------------------------------------------------------
step "2/7 LocalStack"
docker compose -f "$INFRA_DIR/localstack/docker-compose.yml" up -d >/dev/null
wait_for "LocalStack" 90 bash -c 'curl -s http://localhost:4566/_localstack/health | grep -q "\"dynamodb\": \"\(available\|running\)\""'
info "LocalStack listo en http://localhost:4566"

# -------------------------------------------------------------
step "3/7 Infraestructura (Terraform dev, sin Lambdas)"
(
  cd "$INFRA_DIR/environments/dev"
  [ -d .terraform ] || terraform init -input=false -no-color >/dev/null
  # Sin Lambdas: los servicios locales consumen las colas SQS
  terraform apply -auto-approve -input=false -no-color -var enable_lambdas=false > "$LOG_DIR/terraform.log" 2>&1 \
    || { tail -20 "$LOG_DIR/terraform.log"; exit 1; }
  grep -E "Apply complete" "$LOG_DIR/terraform.log" | sed 's/^/  /'
)

# -------------------------------------------------------------
step "4/7 Variables de entorno (.env.local)"
HOST=localhost
if [ "$MODE" = lan ]; then
  # LAN_HOST permite fijar la IP a mano si la detección elige otra interfaz
  HOST=${LAN_HOST:-}
  [ -n "$HOST" ] || HOST=$(node -e "const n=require('os').networkInterfaces();for(const l of Object.values(n))for(const a of l)if(a.family==='IPv4'&&!a.internal&&!a.address.startsWith('172.')){console.log(a.address);process.exit()}")
  [ -n "$HOST" ] || fail "No se pudo detectar la IP de la red local"
fi
node "$LOCAL_DIR/scripts/env-setup.js" "$BACKEND_DIR" "$($FRONT && echo "$FRONTEND_DIR")" "$HOST"

# -------------------------------------------------------------
step "5/7 Backends"
for svc in "${SERVICES[@]}"; do
  if ensure_clean "$svc" "${PORT[$svc]}"; then info "backend-$svc ya está corriendo en :${PORT[$svc]}"; continue; fi
  port_open "${PORT[$svc]}" && fail "El puerto ${PORT[$svc]} lo ocupa otro programa (no es backend-$svc)"
  # NODE_ENV=local -> cada servicio carga su .env.local
  spawn "$svc" "$BACKEND_DIR/backend-$svc" env NODE_ENV=local npm run start:dev
  info "backend-$svc iniciando (log: .run/logs/$svc.log)"
done
for svc in "${SERVICES[@]}"; do
  wait_for "backend-$svc en :${PORT[$svc]} (ver .run/logs/$svc.log)" 240 port_open "${PORT[$svc]}"
  info "backend-$svc listo en http://localhost:${PORT[$svc]}"
done

# -------------------------------------------------------------
step "6/7 Datos de prueba y repartidor simulado"
node "$LOCAL_DIR/scripts/seed.js" "$BACKEND_DIR" "$RUN_DIR"
n=$(proc_count courier-sim | tr -d '\r ')
if [ "$n" = 1 ]; then
  info "simulador de repartidor ya está corriendo"
else
  [ "$n" != 0 ] && proc_stop courier-sim >/dev/null
  # Los endpoints /courier exigen la clave interna: se toma del .env.local de order
  sim_key=$(grep -E '^INTERNAL_API_KEY=' "$BACKEND_DIR/backend-order/.env.local" | head -1 | cut -d= -f2- | tr -d "\"' \r")
  # Recorrido cerca de la tienda de prueba (Lima): debe estar a < 10 km y reportar cada < 120 s
  spawn courier-sim "$BACKEND_DIR/backend-order" env \
    SIM_BASE_URL=http://localhost:3004 \
    SIM_COURIER_ID="$(cat "$RUN_DIR/courier-id")" \
    SIM_STATUS=AVAILABLE \
    SIM_INTERNAL_API_KEY="$sim_key" \
    SIM_POINTS="-11.97900,-77.08100;-11.97950,-77.08200;-11.98000,-77.08250;-11.98050,-77.08300" \
    node scripts/courier-presence-simulator.js
  info "simulador de repartidor iniciado"
fi

# -------------------------------------------------------------
if $FRONT; then
  step "7/7 Frontend (Expo)"
  if [ "$(proc_count expo | tr -d '\r ')" = 1 ] && port_open 8081; then
    info "Expo ya está corriendo en :8081 (para cambiar entre web y --lan: ./down.sh y luego ./up.sh)"
  else
    n=$(proc_stop expo | tr -d '\r ')
    [ "$n" != 0 ] && info "expo: $n proceso(s) huérfanos detenidos" && sleep 2
    port_open 8081 && fail "El puerto 8081 lo ocupa otro programa (no es Expo)"
    if [ "$MODE" = lan ]; then
      spawn expo "$FRONTEND_DIR" npx expo start --lan --port 8081
    else
      spawn expo "$FRONTEND_DIR" env BROWSER=none npx expo start --web --port 8081
    fi
    wait_for "Expo en :8081 (ver .run/logs/expo.log)" 180 port_open 8081
  fi
else
  step "7/7 Frontend omitido (--no-front)"
fi

if $E2E; then
  step "Prueba E2E"
  node "$LOCAL_DIR/scripts/e2e.js" "$BACKEND_DIR"
fi

# -------------------------------------------------------------
printf '\n\033[1;32m✔ FoodStore corriendo en local\033[0m\n'
cat <<EOF

  LocalStack     http://localhost:4566
  auth           http://localhost:3000/auth
  notification   http://localhost:3001
  shop           http://localhost:3002/shop
  checkout       http://localhost:3003/checkout
  order          http://localhost:3004/order   (Socket.IO en :3004)
  payment        http://localhost:3005/payment
EOF
if $FRONT && [ "$MODE" = web ]; then
  echo "  frontend web   http://localhost:8081"
elif $FRONT; then
  echo "  Expo Go        exp://$HOST:8081  (escanea el QR de .run/logs/expo.log o escribe la URL en Expo Go)"
fi
cat <<EOF

  Logs:     $LOG_DIR
  Detener:  $LOCAL_DIR/down.sh
EOF
