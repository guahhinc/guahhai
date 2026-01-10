$ErrorActionPreference = "Stop"
$basePath = "C:\Users\Taj\Downloads\Guahh AI"
$outputFile = Join-Path $basePath "memory.js"
$dataDir = Join-Path $basePath "data"
$data2Dir = Join-Path $basePath "data2"
$data2ConvertedDir = Join-Path $basePath "data2_converted"
$glmFile = "C:\Users\Taj\Downloads\Guahh AI\glm-4.7-2000x\glm-4.7-2000x.jsonl"
$mdFile = Join-Path $basePath "master_knowledge.md"
$pythonConverter = Join-Path $basePath "convert_parquet.py"

Write-Host "Compiling Guahh AI Memory..." -ForegroundColor Cyan

# Convert data2 parquet files if they exist
if ((Test-Path $data2Dir) -and (Test-Path $pythonConverter)) {
    Write-Host "Converting parquet files from data2..." -ForegroundColor Yellow
    try {
        python $pythonConverter
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Parquet conversion successful" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  ⚠ Parquet conversion failed, skipping data2..." -ForegroundColor Yellow
    }
}

$allObjects = @()

# 1. Process GLM File
if (Test-Path $glmFile) {
    Write-Host "  Processing Main Model Data..."
    foreach ($line in Get-Content $glmFile) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        try {
            $json = $line | ConvertFrom-Json
            # Extract Q/A
            $q = $null
            $a = $null
            foreach ($msg in $json.messages) {
                if ($msg.role -eq 'user') { $q = $msg.content }
                if ($msg.role -eq 'assistant') { $a = $msg.content }
            }
            if ($q -and $a) {
                $allObjects += @{ q = $q; a = $a; type = "conv" }
            }
        }
        catch {}
    }
}

# 2. Process Data Directory
if (Test-Path $dataDir) {
    $files = Get-ChildItem $dataDir -Filter "*.jsonl"
    foreach ($file in $files) {
        Write-Host "  Processing $($file.Name)..."
        foreach ($line in Get-Content $file.FullName) {
            if ([string]::IsNullOrWhiteSpace($line)) { continue }
            try {
                $json = $line | ConvertFrom-Json
                # Handle both 'messages' format and simple 'prompt/completion' if exists
                if ($json.messages) {
                    $q = $null
                    $a = $null
                    foreach ($msg in $json.messages) {
                        if ($msg.role -eq 'user') { $q = $msg.content }
                        if ($msg.role -eq 'assistant') { $a = $msg.content }
                    }
                    if ($q -and $a) {
                        $allObjects += @{ q = $q; a = $a; type = "conv" }
                    }
                }
            }
            catch {}
        }
    }
}

# 2b. Process Data2 Converted Directory
if (Test-Path $data2ConvertedDir) {
    $files = Get-ChildItem $data2ConvertedDir -Filter "*.jsonl"
    foreach ($file in $files) {
        Write-Host "  Processing $($file.Name) (from data2)..."
        foreach ($line in Get-Content $file.FullName) {
            if ([string]::IsNullOrWhiteSpace($line)) { continue }
            try {
                $json = $line | ConvertFrom-Json
                if ($json.messages) {
                    $q = $null
                    $a = $null
                    foreach ($msg in $json.messages) {
                        if ($msg.role -eq 'user') { $q = $msg.content }
                        if ($msg.role -eq 'assistant') { $a = $msg.content }
                    }
                    if ($q -and $a) {
                        $allObjects += @{ q = $q; a = $a; type = "conv" }
                    }
                    # Also handle assistant-only messages as knowledge
                    elseif ($a) {
                        $allObjects += @{ q = ""; a = $a; type = "knowledge" }
                    }
                }
            }
            catch {}
        }
    }
}

# 3. Process Dictionary (Markdown)
if (Test-Path $mdFile) {
    Write-Host "  Processing Dictionary..."
    $lines = Get-Content $mdFile
    foreach ($line in $lines) {
        # Match table row: | **Word** | POS | Category | Def |
        if ($line -match "\|\s*\*\*(.*?)\*\*\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|") {
            $word = $matches[1].Trim().ToLower()
            $pos = $matches[2].Trim()
            $cat = $matches[3].Trim()
            $def = $matches[4].Trim()
            
            $allObjects += @{
                word     = $word
                pos      = $pos
                category = $cat
                def      = $def
                type     = "dict"
            }
        }
    }
}

Write-Host "  Serializing $($allObjects.Count) entries to valid JS..."
# Convert to JSON string
$jsonString = $allObjects | ConvertTo-Json -Depth 2 -Compress

# Create JS file
$jsContent = "window.GUAHH_MEMORY = $jsonString;"
Set-Content -Path $outputFile -Value $jsContent -Encoding UTF8

Write-Host "Success! Created 'memory.js' (~ $(("{0:N2}" -f ((Get-Item $outputFile).Length / 1MB))) MB)" -ForegroundColor Green
Write-Host "You can now open 'index.html'."
