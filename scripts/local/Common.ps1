Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Script:ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Script:RuntimeRoot = Join-Path $Script:ProjectRoot ".tmp\project_completion\local_runtime"
$Script:PidRoot = Join-Path $Script:RuntimeRoot "pids"
$Script:LogRoot = Join-Path $Script:RuntimeRoot "logs"
$Script:SiteRoot = Join-Path $Script:RuntimeRoot "site"
$Script:BackendPort = 8010
$Script:FrontendPort = 3000
$Script:PythonExe = Join-Path $Script:ProjectRoot "backend\venv\Scripts\python.exe"
$Script:FrontendDir = Join-Path $Script:ProjectRoot "frontend"
$Script:BackendDir = Join-Path $Script:ProjectRoot "backend"

function Initialize-LocalRuntime {
    foreach ($path in @($Script:RuntimeRoot, $Script:PidRoot, $Script:LogRoot, $Script:SiteRoot)) {
        if (-not (Test-Path $path)) {
            New-Item -ItemType Directory -Path $path -Force | Out-Null
        }
    }
}

function Get-ManagedPidPath([string]$Name) {
    Join-Path $Script:PidRoot "$Name.pid"
}

function Get-ManagedLogPath([string]$Name) {
    @{
        Out = Join-Path $Script:LogRoot "$Name.out.log"
        Err = Join-Path $Script:LogRoot "$Name.err.log"
    }
}

function Test-PortListening([int]$Port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        $connected = $async.AsyncWaitHandle.WaitOne(750, $false)
        if (-not $connected) {
            return $false
        }
        $client.EndConnect($async) | Out-Null
        return $true
    } catch {
        return $false
    } finally {
        $client.Close()
    }
}

function Stop-PortProcesses([int[]]$Ports) {
    foreach ($port in $Ports) {
        $matches = netstat -ano | Select-String ":$port"
        foreach ($match in $matches) {
            $line = ($match.Line -replace "\s+", " ").Trim()
            $parts = $line.Split(" ")
            if ($parts.Length -ge 5) {
                $owningProcess = $parts[-1]
                if ($owningProcess -match '^\d+$') {
                    try {
                        taskkill /PID $owningProcess /T /F 2>$null | Out-Null
                    } catch {
                    }
                }
            }
        }
    }
}

function Stop-ManagedProcesses {
    if (-not (Test-Path $Script:PidRoot)) {
        return
    }

    Get-ChildItem -Path $Script:PidRoot -Filter *.pid -ErrorAction SilentlyContinue | ForEach-Object {
        $processIdValue = (Get-Content $_.FullName -ErrorAction SilentlyContinue | Select-Object -First 1)
        if ($processIdValue -and $processIdValue -match '^\d+$') {
            try {
                taskkill /PID $processIdValue /T /F 2>$null | Out-Null
            } catch {
            }
        }
        Remove-Item -LiteralPath $_.FullName -Force -ErrorAction SilentlyContinue
    }
}

function Start-ManagedProcess {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$ArgumentList,
        [Parameter(Mandatory = $true)][string]$WorkingDirectory
    )

    Initialize-LocalRuntime
    $pidPath = Get-ManagedPidPath $Name
    $logs = Get-ManagedLogPath $Name

    if (Test-Path $pidPath) {
        Remove-Item -LiteralPath $pidPath -Force -ErrorAction SilentlyContinue
    }

    $process = Start-Process `
        -FilePath $FilePath `
        -ArgumentList $ArgumentList `
        -WorkingDirectory $WorkingDirectory `
        -WindowStyle Hidden `
        -RedirectStandardOutput $logs.Out `
        -RedirectStandardError $logs.Err `
        -PassThru

    Set-Content -LiteralPath $pidPath -Value $process.Id -Encoding ascii
    return $process.Id
}

function Wait-ForPort {
    param(
        [Parameter(Mandatory = $true)][int]$Port,
        [int]$TimeoutSeconds = 60
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-PortListening -Port $Port) {
            return $true
        }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

function Build-FrontendVariant {
    param(
        [Parameter(Mandatory = $true)][string]$BasePath,
        [Parameter(Mandatory = $true)][string]$TargetFolder
    )

    $targetPath = Join-Path $Script:SiteRoot $TargetFolder
    if (Test-Path $targetPath) {
        Remove-Item -LiteralPath $targetPath -Recurse -Force
    }
    New-Item -ItemType Directory -Path $targetPath -Force | Out-Null

    Push-Location $Script:FrontendDir
    try {
        if (Test-Path "out") {
            Remove-Item -LiteralPath "out" -Recurse -Force
        }

        $env:NEXT_PUBLIC_API_URL = "https://smart-cv.it/api"
        $env:NEXT_PUBLIC_BASE_PATH = $BasePath
        $env:NEXT_PUBLIC_APP_NAME = "Gestionale Calabria Verde"
        $env:NEXT_PUBLIC_APP_VERSION = "1.0.0"

        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) {
            throw "Build frontend non riuscita per $BasePath"
        }

        Copy-Item -Path (Join-Path $Script:FrontendDir "out\*") -Destination $targetPath -Recurse -Force
    } finally {
        Pop-Location
    }
}

function Prepare-SiteRoot {
    Initialize-LocalRuntime

    $gestionaleRoot = Join-Path $Script:SiteRoot "gestionale"
    if (-not (Test-Path $gestionaleRoot)) {
        New-Item -ItemType Directory -Path $gestionaleRoot -Force | Out-Null
    }
}

function Start-BackendLocal {
    if (-not (Test-Path $Script:PythonExe)) {
        throw "Python virtualenv non trovato: $Script:PythonExe"
    }

    if (Test-PortListening -Port $Script:BackendPort) {
        Stop-PortProcesses -Ports @($Script:BackendPort)
        Start-Sleep -Seconds 1
    }

    $env:DB_HOST = "localhost"
    $env:DB_PORT = "3306"
    $env:DB_NAME = "gestionale_cv"
    $env:DB_USER = "root"
    $env:DB_PASSWORD = ""
    $env:LOCAL_DB_NO_PASSWORD = "true"
    $env:APP_ENV = "development"
    $env:APP_DEBUG = "true"

    Start-ManagedProcess `
        -Name "backend-local" `
        -FilePath $Script:PythonExe `
        -ArgumentList @("-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "$($Script:BackendPort)") `
        -WorkingDirectory $Script:BackendDir | Out-Null

    if (-not (Wait-ForPort -Port $Script:BackendPort)) {
        throw "Backend locale non raggiungibile sulla porta $Script:BackendPort. Controlla i log in $Script:LogRoot"
    }
}

function Start-FrontendStaticHost {
    if (Test-PortListening -Port $Script:FrontendPort) {
        Stop-PortProcesses -Ports @($Script:FrontendPort)
        Start-Sleep -Seconds 1
    }

    Start-ManagedProcess `
        -Name "frontend-static" `
        -FilePath $Script:PythonExe `
        -ArgumentList @("-m", "http.server", "$($Script:FrontendPort)", "--bind", "127.0.0.1", "--directory", $Script:SiteRoot) `
        -WorkingDirectory $Script:ProjectRoot | Out-Null

    if (-not (Wait-ForPort -Port $Script:FrontendPort)) {
        throw "Server frontend locale non raggiungibile sulla porta $Script:FrontendPort. Controlla i log in $Script:LogRoot"
    }
}

function Start-CollaudoOnly {
    Prepare-SiteRoot
    Build-FrontendVariant -BasePath "/gestionale/collaudo" -TargetFolder "gestionale\collaudo"
    Start-FrontendStaticHost
}

function Start-TestOnly {
    Prepare-SiteRoot
    Build-FrontendVariant -BasePath "/gestionale/test" -TargetFolder "gestionale\test"
    Start-FrontendStaticHost
}

function Start-AllLocal {
    Prepare-SiteRoot
    Build-FrontendVariant -BasePath "/gestionale/collaudo" -TargetFolder "gestionale\collaudo"
    Build-FrontendVariant -BasePath "/gestionale/test" -TargetFolder "gestionale\test"
    Start-FrontendStaticHost
}

function Show-LocalEndpoints {
    Write-Host ""
    Write-Host "Collaudo locale:"
    Write-Host ("  http://127.0.0.1:{0}/gestionale/collaudo/login/" -f $Script:FrontendPort)
    Write-Host ""
    Write-Host "Test locale:"
    Write-Host ("  http://127.0.0.1:{0}/gestionale/test/login/" -f $Script:FrontendPort)
    Write-Host ""
    Write-Host "API usata dal frontend locale:"
    Write-Host "  https://smart-cv.it/api"
    Write-Host ""
}
