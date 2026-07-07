# Petit serveur statique local pour tester la plateforme sans rien installer.
# Lancer :  clic droit > "Exécuter avec PowerShell"  (ou .\serveur-local.ps1)
# Puis ouvrir  http://localhost:8123  dans le navigateur.

param([int]$Port = 8123)

$racine = $PSScriptRoot
$mimes = @{
  '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'
  '.js'='text/javascript; charset=utf-8'; '.json'='application/json; charset=utf-8'
  '.woff2'='font/woff2'; '.png'='image/png'; '.jpg'='image/jpeg'; '.svg'='image/svg+xml'
  '.webp'='image/webp'; '.ico'='image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Bureau des Indices : http://localhost:$Port  (Ctrl+C pour arrêter)"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $chemin = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
  if ($chemin -eq '/') { $chemin = '/index.html' }
  $fichier = Join-Path $racine ($chemin -replace '/', '\')
  if ((Test-Path $fichier -PathType Leaf) -and ((Resolve-Path $fichier).Path.StartsWith($racine))) {
    $ext = [System.IO.Path]::GetExtension($fichier).ToLower()
    $ctx.Response.ContentType = if ($mimes[$ext]) { $mimes[$ext] } else { 'application/octet-stream' }
    $octets = [System.IO.File]::ReadAllBytes($fichier)
    $ctx.Response.ContentLength64 = $octets.Length
    try { $ctx.Response.OutputStream.Write($octets, 0, $octets.Length) } catch {}
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.Close()
}
