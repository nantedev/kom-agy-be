import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import console from 'node:console'
import { execSync } from 'node:child_process'

let inputData = ''
try {
  inputData = fs.readFileSync(0, 'utf-8')
} catch {
  // Ignoré : stdin vide
}

let payload = {}
try {
  payload = JSON.parse(inputData)
} catch {
  // Ignoré : JSON invalide
}

// N'intercepte que la fin normale de tour sans appel d'outil
if (payload.terminationReason && payload.terminationReason !== 'NO_TOOL_CALL') {
  console.log(JSON.stringify({ decision: 'allow' }))
  process.exit(0)
}

const rootDir = (payload.workspacePaths && payload.workspacePaths[0]) || path.resolve(import.meta.dirname, '..')

try {
  execSync('pnpm lint', { cwd: rootDir, stdio: 'pipe', encoding: 'utf-8' })
  console.log(JSON.stringify({ decision: 'allow' }))
} catch (error) {
  const errorOutput = [error.stdout, error.stderr].filter(Boolean).join('\n').trim()
  console.log(
    JSON.stringify({
      decision: 'continue',
      reason: `Des erreurs de lint ont été détectées avec pnpm lint :\n\n${errorOutput}\n\nMerci de corriger ces erreurs de lint avant de terminer.`,
    })
  )
}
