/**
 * API contract copy from the backend checkout (decision D2).
 *
 *   node scripts/contract.mjs sync   copy the contract files from the backend
 *                                    and write docs/contract.lock
 *   node scripts/contract.mjs check  fail when the copies differ from the backend
 *                                    checkout or were edited by hand
 *
 * The backend checkout is read only. Its path is QONAQDASH_BACKEND_DIR,
 * relative to this repository, default ../qonaqdash.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BACKEND = path.resolve(ROOT, process.env.QONAQDASH_BACKEND_DIR || '../qonaqdash')
const FILES = ['docs/swagger.yaml', 'docs/integration.md']
const LOCK = 'docs/contract.lock'

function fail(message) {
  console.error(`contract: ${message}`)
  process.exit(1)
}

function git(...args) {
  return execFileSync('git', ['-C', BACKEND, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function sha256(file) {
  return `sha256:${createHash('sha256').update(readFileSync(file)).digest('hex')}`
}

function short(commit) {
  return typeof commit === 'string' ? commit.slice(0, 7) : String(commit)
}

/** Commit, branch and whether the contract files have uncommitted changes. */
function backendState() {
  if (!existsSync(BACKEND)) {
    fail(`backend checkout not found at ${BACKEND}. Set QONAQDASH_BACKEND_DIR.`)
  }
  for (const file of FILES) {
    if (!existsSync(path.join(BACKEND, file))) fail(`${file} is missing in ${BACKEND}`)
  }
  try {
    return {
      commit: git('rev-parse', 'HEAD'),
      // "HEAD" when the checkout is detached.
      branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
      dirty: git('status', '--porcelain', '--', ...FILES) !== '',
    }
  } catch (err) {
    fail(`cannot read git state of ${BACKEND}: ${err.stderr || err.message}`)
  }
}

function describe(state) {
  return `${state.branch} @ ${short(state.commit)}${state.dirty ? ' with uncommitted contract changes' : ''}`
}

function sync() {
  const state = backendState()
  const files = {}
  for (const file of FILES) {
    copyFileSync(path.join(BACKEND, file), path.join(ROOT, file))
    files[file] = sha256(path.join(ROOT, file))
  }
  const lock = {
    backend: state,
    synced_at: new Date().toISOString(),
    files,
  }
  writeFileSync(path.join(ROOT, LOCK), `${JSON.stringify(lock, null, 2)}\n`)

  console.log(`contract: synced ${FILES.join(', ')} from ${BACKEND} (${describe(state)})`)
  if (state.dirty) {
    console.warn(
      'contract: warning: the backend contract has uncommitted changes, ' +
        'so the commit in the lock does not fully describe the copy',
    )
  }
}

function check() {
  const lockPath = path.join(ROOT, LOCK)
  if (!existsSync(lockPath)) fail(`${LOCK} is missing. Run npm run contract:sync.`)
  let lock
  try {
    lock = JSON.parse(readFileSync(lockPath, 'utf8'))
  } catch {
    fail(`${LOCK} is not valid JSON. Run npm run contract:sync.`)
  }

  const state = backendState()
  const problems = []
  for (const file of FILES) {
    const copy = path.join(ROOT, file)
    if (!existsSync(copy)) {
      problems.push(`${file}: missing`)
      continue
    }
    if (lock.files?.[file] !== sha256(copy)) {
      problems.push(`${file}: does not match ${LOCK}, edited by hand?`)
    }
    if (!readFileSync(copy).equals(readFileSync(path.join(BACKEND, file)))) {
      problems.push(`${file}: differs from ${BACKEND} (${describe(state)})`)
    }
  }

  if (problems.length > 0) {
    console.error('contract: the copy is out of sync:')
    for (const problem of problems) console.error(`  - ${problem}`)
    console.error('Run npm run contract:sync and commit the result.')
    process.exit(1)
  }

  console.log(`contract: copies match ${BACKEND} (${describe(state)})`)
  if (lock.backend?.commit !== state.commit) {
    console.log(
      `contract: note: ${LOCK} records ${short(lock.backend?.commit)}, ` +
        `the backend is at ${short(state.commit)}; the contract files are the same`,
    )
  }
  if (state.dirty) {
    console.warn('contract: warning: the backend contract has uncommitted changes')
  }
}

const command = process.argv[2]
if (command === 'sync') sync()
else if (command === 'check') check()
else fail('usage: node scripts/contract.mjs <sync|check>')
