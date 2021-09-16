#!/usr/bin/env pwsh
$StartingPoint = "mod.ts"
if ($args.Length -eq 1) {
  $StartingPoint = $args.Get(0)
}

deno run --allow-env --allow-net --allow-read --unstable --allow-run $StartingPoint