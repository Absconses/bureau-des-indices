# Reconstruit content/programme.json à partir des fichiers de modules présents
# dans content/modules/ et des libellés de docs/spec-programme-complet.json.
# À relancer après tout ajout/suppression de module.

$ErrorActionPreference = 'Stop'
$racine = Split-Path $PSScriptRoot
$spec = Get-Content (Join-Path $racine 'docs\spec-programme-complet.json') -Raw -Encoding UTF8 | ConvertFrom-Json

$ordreParcours = @('5e', '4e', '3e')
$ordreDomaines = @('D1', 'D2', 'D3')
$ordreRubriques = @{ 'D1' = @('EXP', 'FON', 'LAN'); 'D2' = @('OUT', 'RECH', 'EVAL'); 'D3' = @('ELAB', 'PROD', 'POST') }

# 1. Lire tous les modules
$modules = @()
$erreurs = @()
Get-ChildItem (Join-Path $racine 'content\modules') -Filter '*.json' | Where-Object { $_.Name -notmatch '^_' } | ForEach-Object {
  try {
    $m = Get-Content $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
    if (-not $m.id -or -not $m.titre -or -not $m.objectif) { throw 'champs id/titre/objectif manquants' }
    $modules += $m
  } catch {
    $erreurs += "$($_.Exception.Message) <- $($_.FullName)"
  }
}
if ($erreurs.Count) {
  Write-Warning "Modules ignorés (invalides) :"
  $erreurs | ForEach-Object { Write-Warning "  $_" }
}

# 2. Construire l'arborescence parcours > domaines > rubriques > modules
$parcoursListe = @()
foreach ($p in $ordreParcours) {
  $domainesListe = @()
  foreach ($d in $ordreDomaines) {
    $rubriquesListe = @()
    foreach ($r in $ordreRubriques[$d]) {
      $modsRubrique = $modules | Where-Object { $_.parcours -eq $p -and $_.domaine -eq $d -and $_.rubrique -eq $r } |
        Sort-Object { [int]($_.id -split '\.')[-1] }
      if (-not $modsRubrique) { continue }
      $cle = "$d.$r"
      $nomRubrique = $spec.rubriques.PSObject.Properties["$cle@$p"].Value
      if (-not $nomRubrique) { $nomRubrique = $spec.rubriques.$cle }
      $rubriquesListe += [ordered]@{
        id = $r
        nom = $nomRubrique
        modules = @($modsRubrique | ForEach-Object {
          [ordered]@{
            id = $_.id
            titre = $_.titre
            objectif = $_.objectif
            disponible = $true
            fichier = "content/modules/$($_.id).json"
          }
        })
      }
    }
    $infoDomaine = $spec.domaines.$d
    $domainesListe += [ordered]@{
      id = $d
      nom = $infoDomaine.nom
      labelEleve = $infoDomaine.labelEleve
      couleur = $infoDomaine.couleur
      disponible = ($rubriquesListe.Count -gt 0)
      rubriques = @($rubriquesListe)
    }
  }
  $parcoursListe += [ordered]@{
    id = $p
    label = "Parcours $p"
    domaines = @($domainesListe)
  }
}

$programme = [ordered]@{
  version = 2
  source = "Projet de programmes d'éducation aux médias et à l'information du cycle 4, CSP, juin 2025"
  parcours = @($parcoursListe)
}

$sortie = Join-Path $racine 'content\programme.json'
$json = $programme | ConvertTo-Json -Depth 12
[System.IO.File]::WriteAllText($sortie, $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "programme.json régénéré : $($modules.Count) modules répartis sur $($parcoursListe.Count) parcours."
