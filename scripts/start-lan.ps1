<#
.SYNOPSIS
  Prepara Smart Chef para acceder desde otros dispositivos de tu red WiFi local.

.DESCRIPTION
  1. Detecta la IP local (IPv4) de este PC en la red LAN.
  2. Genera/actualiza frontend/.env.local con VITE_API_URL apuntando a esa IP.
  3. Comprueba si el firewall de Windows tiene reglas de entrada para los
     puertos del backend (3000) y del frontend (5173), y ofrece crearlas.
  4. Muestra las URLs a usar desde el propio PC y desde otros dispositivos.

  No arranca el backend ni el frontend por ti: hazlo en dos terminales
  aparte (ver la salida de este script o el README).
#>

$ErrorActionPreference = 'Stop'

$BackendPort = 3000
$FrontendPort = 5173

# 1. Detectar IP LAN

$ip = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -ne '127.0.0.1' -and
    $_.PrefixOrigin -in @('Dhcp', 'Manual') -and
    $_.InterfaceAlias -notmatch 'Loopback|vEthernet|WSL|Virtual|Docker'
  } |
  Select-Object -First 1 -ExpandProperty IPAddress

if (-not $ip) {
  Write-Warning "No se pudo detectar automáticamente una IP de LAN. Ejecuta 'ipconfig' y busca manualmente la IPv4 de tu adaptador WiFi/Ethernet."
  $ip = Read-Host "Introduce esa IP manualmente"
}

Write-Host "IP local detectada: $ip" -ForegroundColor Cyan

# 2. Escribir frontend/.env.local

$envLocalPath = Join-Path $PSScriptRoot '..\frontend\.env.local'
$envContent = "VITE_API_URL=http://${ip}:${BackendPort}/api`n"
Set-Content -Path $envLocalPath -Value $envContent -Encoding utf8NoBOM -NoNewline
Write-Host "Escrito $envLocalPath con VITE_API_URL=http://${ip}:${BackendPort}/api" -ForegroundColor Cyan

# 3. Comprobar reglas de firewall

function Test-FirewallRuleForPort($port) {
  $rules = Get-NetFirewallPortFilter -Protocol TCP |
    Where-Object { $_.LocalPort -eq $port } |
    Get-NetFirewallRule |
    Where-Object { $_.Direction -eq 'Inbound' -and $_.Enabled -eq 'True' -and $_.Action -eq 'Allow' }
  return @($rules).Count -gt 0
}

foreach ($port in @($BackendPort, $FrontendPort)) {
  if (Test-FirewallRuleForPort $port) {
    Write-Host "Firewall: puerto $port ya tiene una regla de entrada permitida." -ForegroundColor Green
  } else {
    Write-Warning "Firewall: no se encontró regla de entrada permitida para el puerto $port."
    $crear = Read-Host "¿Crear regla 'Smart Chef LAN $port' ahora? (requiere ejecutar PowerShell como Administrador) [s/N]"
    if ($crear -eq 's' -or $crear -eq 'S') {
      try {
        New-NetFirewallRule -DisplayName "Smart Chef LAN $port" -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow -Profile Private | Out-Null
        Write-Host "Regla creada para el puerto $port (perfil Private)." -ForegroundColor Green
      } catch {
        Write-Warning "No se pudo crear la regla automáticamente (¿PowerShell no elevado?). Créala manualmente, ver README."
      }
    }
  }
}

# 4. Resumen

Write-Host ""
Write-Host "=== Smart Chef -- modo LAN ===" -ForegroundColor Cyan
Write-Host "Backend  (Terminal 1): docker-compose up db backend"
Write-Host "Frontend (Terminal 2): cd frontend; npm run dev"
Write-Host ""
Write-Host "Desde este PC:        http://localhost:$FrontendPort"
Write-Host "Desde otro dispositivo de la misma WiFi: http://${ip}:${FrontendPort}"
Write-Host ""
Write-Host "Si el login falla desde otro dispositivo, revisa la consola del navegador:"
Write-Host " - Error de CORS -> confirma que backend/.env NODE_ENV=development (o añade el origen a CORS_ORIGIN)"
Write-Host " - Conexión rechazada -> revisa el firewall de Windows (ver arriba) y que backend/frontend sigan corriendo"
