. (Join-Path $PSScriptRoot "Common.ps1")

Start-TestOnly

Write-Host "Test locale avviato."
Write-Host ("URL: http://127.0.0.1:{0}/gestionale/test/login/" -f $Script:FrontendPort)
Write-Host ("API: http://127.0.0.1:{0}/api/health" -f $Script:BackendPort)
