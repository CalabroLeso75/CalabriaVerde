#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Commit Agent — Calabria Verde Gestionale
    Gestisce commit semantici versionati con aggiornamento automatico CHANGELOG.

.DESCRIPTION
    Script da eseguire dopo ogni sessione di lavoro.
    - Rileva automaticamente i file modificati
    - Crea commit semantici con tipo (feat/fix/chore/docs/refactor)
    - Aggiorna la versione in base al tipo di modifica
    - Mantiene il CHANGELOG aggiornato

.PARAMETER Type
    Tipo di commit: feat | fix | docs | chore | refactor | style | test
    
.PARAMETER Message
    Messaggio breve del commit (max 72 caratteri)

.PARAMETER Description
    Descrizione lunga opzionale (corpo del commit)

.PARAMETER Breaking
    Switch: indica un breaking change (incrementa MAJOR)

.EXAMPLE
    .\commit_agent.ps1 -Type feat -Message "Aggiunto modulo Magazzino" -Description "CRUD prodotti, movimentazioni, inventario"
    .\commit_agent.ps1 -Type fix -Message "Corretta validazione CF nel form registrazione"
    .\commit_agent.ps1 -Type docs -Message "Aggiornato CHANGELOG e activity_log"

.NOTES
    Versioning Semantico: MAJOR.MINOR.PATCH
    feat → incrementa MINOR (0.3.0 → 0.4.0)
    fix/chore/docs/style/test → incrementa PATCH (0.3.0 → 0.3.1)
    feat + Breaking → incrementa MAJOR (0.3.0 → 1.0.0)
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("feat","fix","docs","chore","refactor","style","test","build")]
    [string]$Type,
    
    [Parameter(Mandatory=$true)]
    [string]$Message,
    
    [string]$Description = "",
    [string]$Scope = "",
    [switch]$Breaking
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = "c:\Users\Antigravity\Desktop\Calabriaverde"
$ChangelogPath = "$RepoRoot\CHANGELOG.md"
$VersionFile = "$RepoRoot\.version"

# ============================================
# 1. LEGGI VERSIONE CORRENTE
# ============================================
if (Test-Path $VersionFile) {
    $currentVersion = Get-Content $VersionFile -Raw | ForEach-Object { $_.Trim() }
} else {
    $currentVersion = "0.3.0"
    Set-Content $VersionFile $currentVersion
}

$parts = $currentVersion -split '\.'
[int]$major = $parts[0]
[int]$minor = $parts[1]
[int]$patch = $parts[2]

# ============================================
# 2. CALCOLA NUOVA VERSIONE
# ============================================
if ($Breaking) {
    $major++; $minor = 0; $patch = 0
} elseif ($Type -eq "feat" -or $Type -eq "refactor") {
    $minor++; $patch = 0
} else {
    # fix, docs, chore, style, test, build
    $patch++
}

$newVersion = "$major.$minor.$patch"
$date = Get-Date -Format "yyyy-MM-dd"
$datetime = Get-Date -Format "yyyy-MM-dd HH:mm"

# ============================================
# 3. COSTRUISCI MESSAGGIO COMMIT SEMANTICO
# ============================================
$scopePart = if ($Scope) { "($Scope)" } else { "" }
$breakingMark = if ($Breaking) { "!" } else { "" }
$commitTitle = "$Type$scopePart$breakingMark`: $Message"

# Corpo commit
$commitBody = @()
if ($Description) { $commitBody += $Description }
if ($Breaking) { $commitBody += "`nBREAKING CHANGE: $Description" }
$commitBody += "`nVersion: v$newVersion"
$commitBody += "Agent: CommitAgent/1.0"
$commitBody += "Timestamp: $datetime"

$fullCommitMsg = $commitTitle + "`n`n" + ($commitBody -join "`n")

# ============================================
# 4. GIT ADD + STATUS
# ============================================
Write-Host "`n🤖 Commit Agent — Calabria Verde v$newVersion" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor DarkGray

Push-Location $RepoRoot
try {
    # Mostra file modificati
    Write-Host "`n📁 File modificati:" -ForegroundColor Yellow
    git status --short
    
    $changedFiles = git status --porcelain
    if (-not $changedFiles) {
        Write-Host "`n⚠  Nessun file da committare." -ForegroundColor Yellow
        return
    }
    
    # Aggiungi tutto (rispettando .gitignore)
    git add --all
    Write-Host "`n✅ File aggiunti allo staging." -ForegroundColor Green

    # ============================================
    # 5. AGGIORNA VERSION FILE E CHANGELOG
    # ============================================
    Set-Content $VersionFile $newVersion

    # Inserisci nuova sezione nel CHANGELOG
    $changelogContent = Get-Content $ChangelogPath -Raw
    $newSection = @"

## [$newVersion] — $date

### $($Type.ToUpper()) — $Message
$(if ($Description) { "`n$Description`n" })
---
"@
    $changelogContent = $changelogContent -replace "## \[Unreleased\]", "## [Unreleased]`n$newSection"
    Set-Content $ChangelogPath $changelogContent
    
    git add $VersionFile $ChangelogPath
    Write-Host "📝 CHANGELOG e version file aggiornati." -ForegroundColor Green

    # ============================================
    # 6. ESEGUI COMMIT
    # ============================================
    git commit -m $fullCommitMsg
    
    Write-Host "`n✅ Commit eseguito: $commitTitle" -ForegroundColor Green
    Write-Host "🏷  Versione: v$currentVersion → v$newVersion" -ForegroundColor Cyan

    # ============================================
    # 7. CREA TAG DI VERSIONE
    # ============================================
    $tagMsg = "Release v$newVersion — $Message"
    git tag -a "v$newVersion" -m $tagMsg
    Write-Host "🏷  Tag creato: v$newVersion" -ForegroundColor Cyan

    # ============================================
    # 8. LOG COMMIT
    # ============================================
    Write-Host "`n📋 Ultimo commit:" -ForegroundColor Yellow
    git log --oneline -1

} catch {
    Write-Host "`n❌ Errore: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}

Write-Host "`n🎉 Commit Agent completato con successo!" -ForegroundColor Green
Write-Host "   Per pushare: git push origin main --tags" -ForegroundColor DarkGray
