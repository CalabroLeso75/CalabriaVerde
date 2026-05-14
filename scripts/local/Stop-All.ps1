. (Join-Path $PSScriptRoot "Common.ps1")

Stop-ManagedProcesses
Stop-PortProcesses -Ports @($Script:BackendPort, $Script:FrontendPort)

Write-Host "Processi locali fermati."
