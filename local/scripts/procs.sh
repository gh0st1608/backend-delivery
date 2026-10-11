#!/usr/bin/env bash
# Utilidades de procesos compartidas por up.sh y down.sh.
#
# Los procesos se identifican por su línea de comando, no por PID:
# `nest start --watch` lanza la app como proceso hijo y la relanza en cada
# cambio de archivo, así que matar solo el proceso que escucha en el puerto
# deja vivo al vigilante (y varios vigilantes compiten luego por el puerto).

is_windows() { case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) return 0 ;; *) return 1 ;; esac; }

# Patrón (comodines de PowerShell -like / regex de pkill) de cada componente
proc_pattern() { # proc_pattern <auth|shop|...|expo|courier-sim>
  case "$1" in
    expo)        is_windows && echo '*frontend-delivery?node_modules*expo*start*' || echo 'frontend-delivery/node_modules/.*expo.*start' ;;
    courier-sim) is_windows && echo '*courier-presence-simulator*'               || echo 'courier-presence-simulator' ;;
    *)           is_windows && echo "*backend-delivery?backend-$1?*"              || echo "backend-delivery/backend-$1/(node_modules|\.build)" ;;
  esac
}

# Cantidad de procesos node del componente
proc_count() { # proc_count <componente> [watchers]
  local pattern; pattern=$(proc_pattern "$1")
  if is_windows; then
    local extra=''
    [ "${2:-}" = watchers ] && extra=" -and \$_.CommandLine -like '*nest*start*'"
    powershell -NoProfile -Command "@(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { \$_.CommandLine -like '$pattern'$extra }).Count"
  else
    if [ "${2:-}" = watchers ]; then pgrep -fc "${pattern}.*nest.*start|nest.*start.*${pattern}" || true
    else pgrep -fc "$pattern" || true; fi
  fi
}

# Detiene todos los procesos node del componente; imprime cuántos detuvo
proc_stop() { # proc_stop <componente>
  local pattern; pattern=$(proc_pattern "$1")
  if is_windows; then
    powershell -NoProfile -Command "\$p = @(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { \$_.CommandLine -like '$pattern' }); \$p | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue }; \$p.Count"
  else
    local n; n=$(pgrep -fc "$pattern" || true)
    pkill -f "$pattern" 2>/dev/null || true
    echo "${n:-0}"
  fi
}
