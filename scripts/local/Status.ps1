. (Join-Path $PSScriptRoot "Common.ps1")

$services = @(
    @{ Name = "frontend"; Port = $Script:FrontendPort; Url = "http://127.0.0.1:$($Script:FrontendPort)/gestionale/collaudo/login/" }
)

foreach ($service in $services) {
    $online = Test-PortListening -Port $service.Port
    $status = if ($online) { "ATTIVO" } else { "SPENTO" }
    Write-Host ("{0,-10} {1,-8} {2}" -f $service.Name, $status, $service.Url)
}

Write-Host ""
Write-Host ("Collaudo: http://127.0.0.1:{0}/gestionale/collaudo/login/" -f $Script:FrontendPort)
Write-Host ("Test:      http://127.0.0.1:{0}/gestionale/test/login/" -f $Script:FrontendPort)
Write-Host ("API Test:  {0}" -f $Script:TestApiUrl)
Write-Host ("API Coll.: {0}" -f $Script:TestApiUrl)
