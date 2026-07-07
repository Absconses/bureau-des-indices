# Extrait un fichier .h5p (de Lümi ou d'ailleurs) dans le dossier h5p/ de la
# plateforme, prêt à être embarqué par une activité de type "h5p-embed".
#
# Usage (clic droit > Exécuter avec PowerShell demande les paramètres) :
#   .\extraire-h5p.ps1 -Fichier "C:\...\mon-contenu.h5p" -Nom "mon-contenu"
#
# Puis dans le module JSON :
#   { "id": "A3", "type": "h5p-embed", "famille": "manipulation",
#     "xpParReussite": 10,
#     "variantes": [ { "dossier": "h5p/mon-contenu", "consigne": "..." } ] }

param(
  [Parameter(Mandatory = $true)][string]$Fichier,
  [Parameter(Mandatory = $true)][string]$Nom
)

$destination = Join-Path (Split-Path $PSScriptRoot) "h5p\$Nom"
if (Test-Path $destination) { Remove-Item -Recurse -Force $destination }
New-Item -ItemType Directory -Force $destination | Out-Null

$zip = "$env:TEMP\$Nom.zip"
Copy-Item $Fichier $zip -Force
Expand-Archive -Path $zip -DestinationPath $destination -Force
Remove-Item $zip

if (Test-Path (Join-Path $destination 'h5p.json')) {
  Write-Host "OK : contenu extrait dans h5p\$Nom"
  $json = Get-Content (Join-Path $destination 'h5p.json') -Raw | ConvertFrom-Json
  Write-Host "Bibliothèque principale : $($json.mainLibrary)"
  $libs = Get-ChildItem $destination -Directory | Where-Object { $_.Name -match '^H5P\.' }
  if ($libs.Count -eq 0) {
    Write-Warning "Ce .h5p ne contient pas ses bibliothèques (export 'contenu seul')."
    Write-Warning "Réexporte-le depuis Lumi avec les bibliothèques incluses."
  }
} else {
  Write-Warning "h5p.json introuvable : ce fichier n'est pas un .h5p valide."
}
