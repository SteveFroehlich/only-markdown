/**
 * Only Markdown — local markdown → HTML viewer
 * Processing: read .md, convert with markdown-it (GFM-ish defaults)
 * Display: React shell consumes HTML; no editing
 */

const express = require('express')
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')
const MarkdownIt = require('markdown-it')

const app = express()
const PORT = process.env.PORT || 8080
const CONTAINER_DATA_DIR = '/app/data'
const LOCAL_DATA_DIR = path.join(__dirname, 'data')
const STARTUP_TARGET_ARG = process.argv[2]

function detectDataDir() {
  if (process.env.DATA_DIR) {
    return path.resolve(process.env.DATA_DIR)
  }
  if (fs.existsSync(CONTAINER_DATA_DIR)) {
    return CONTAINER_DATA_DIR
  }
  return LOCAL_DATA_DIR
}

const DATA_DIR = detectDataDir()

function resolveInputPath(inputPath, baseDir = DATA_DIR) {
  if (typeof inputPath !== 'string' || inputPath.trim() === '') {
    throw new Error('Invalid path')
  }
  const cleanedPath = inputPath.trim()
  if (path.isAbsolute(cleanedPath)) {
    return path.normalize(cleanedPath)
  }
  return path.resolve(baseDir, cleanedPath)
}

function getStartupScope() {
  if (!STARTUP_TARGET_ARG) {
    return {
      rootDirectory: path.resolve(DATA_DIR),
      lockedFilePath: null,
    }
  }

  const resolvedTarget = resolveInputPath(STARTUP_TARGET_ARG, process.cwd())
  if (!fs.existsSync(resolvedTarget)) {
    throw new Error(`Startup path does not exist: ${resolvedTarget}`)
  }

  const targetStats = fs.statSync(resolvedTarget)
  if (targetStats.isDirectory()) {
    return {
      rootDirectory: resolvedTarget,
      lockedFilePath: null,
    }
  }

  if (!targetStats.isFile()) {
    throw new Error(`Startup path is not a file or directory: ${resolvedTarget}`)
  }

  if (!resolvedTarget.toLowerCase().endsWith('.md')) {
    throw new Error(`Startup file must be .md: ${resolvedTarget}`)
  }

  return {
    rootDirectory: path.dirname(resolvedTarget),
    lockedFilePath: resolvedTarget,
  }
}

const ACCESS_SCOPE = getStartupScope()

function isInsideScope(targetPath) {
  const relative = path.relative(ACCESS_SCOPE.rootDirectory, targetPath)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function assertInsideScope(targetPath) {
  if (!isInsideScope(targetPath)) {
    throw new Error(`Path is outside allowed scope: ${ACCESS_SCOPE.rootDirectory}`)
  }
}

function assertMarkdownAllowed(targetPath) {
  assertInsideScope(targetPath)
  if (ACCESS_SCOPE.lockedFilePath && targetPath !== ACCESS_SCOPE.lockedFilePath) {
    throw new Error(`App is locked to startup file: ${ACCESS_SCOPE.lockedFilePath}`)
  }
  if (!targetPath.toLowerCase().endsWith('.md')) {
    throw new Error(`Not a markdown file: ${targetPath}`)
  }
}

function resolveDataPath(filePath) {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new Error('Invalid file path')
  }
  return resolveInputPath(filePath, ACCESS_SCOPE.rootDirectory)
}

function listMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile())
    .filter((entry) => entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => ({
      name: entry.name,
      path: path.join(dir, entry.name),
    }))
    .filter((entry) => !ACCESS_SCOPE.lockedFilePath || entry.path === ACCESS_SCOPE.lockedFilePath)
    .sort((a, b) => a.name.localeCompare(b.name))
}

function createMarkdownRenderer(baseDir) {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: false,
  })

  const defaultImage =
    md.renderer.rules.image ||
    function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options)
    }

  md.renderer.rules.image = function (tokens, idx, options, env, self) {
    const token = tokens[idx]
    const srcIndex = token.attrIndex('src')
    if (srcIndex >= 0) {
      const src = token.attrs[srcIndex][1]
      if (src && !/^(https?:|data:|\/\/)/i.test(src)) {
        const resolved = path.resolve(baseDir, decodeURIComponent(src))
        token.attrs[srcIndex][1] = `/api/asset?path=${encodeURIComponent(resolved)}`
      }
    }
    return defaultImage(tokens, idx, options, env, self)
  }

  return md
}

app.use(express.json({ limit: '10mb' }))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/api/status', (_req, res) => {
  res.json({
    rootDirectory: ACCESS_SCOPE.rootDirectory,
    lockedFilePath: ACCESS_SCOPE.lockedFilePath,
    mode: ACCESS_SCOPE.lockedFilePath ? 'file' : 'directory',
  })
})

app.get('/api/list', (_req, res) => {
  try {
    const dir = ACCESS_SCOPE.rootDirectory
    if (!fs.existsSync(dir)) {
      return res.status(404).json({ error: `Directory not found: ${dir}` })
    }
    const files = listMarkdownFiles(dir)
    res.json({
      directory: dir,
      files,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/render', (req, res) => {
  try {
    const { filePath } = req.body
    if (!filePath) {
      return res.status(400).json({ error: 'No file path provided' })
    }

    const resolvedPath = resolveDataPath(filePath)
    assertMarkdownAllowed(resolvedPath)

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    const source = fs.readFileSync(resolvedPath, 'utf-8')
    const md = createMarkdownRenderer(path.dirname(resolvedPath))
    const html = md.render(source)

    res.json({
      success: true,
      fileName: path.basename(resolvedPath),
      filePath: resolvedPath,
      html,
      renderedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Error rendering:', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/asset', (req, res) => {
  try {
    const rawPath = req.query.path
    if (typeof rawPath !== 'string' || !rawPath) {
      return res.status(400).json({ error: 'No path provided' })
    }

    const resolvedPath = path.normalize(rawPath)
    assertInsideScope(resolvedPath)

    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    const contentType = mime.lookup(resolvedPath) || 'application/octet-stream'
    res.setHeader('Content-Type', contentType)
    fs.createReadStream(resolvedPath).pipe(res)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const server = app.listen(PORT, () => {
  fs.mkdirSync(ACCESS_SCOPE.rootDirectory, { recursive: true })

  console.log(`\nOnly Markdown server at http://localhost:${PORT}`)
  console.log(`Allowed root: ${ACCESS_SCOPE.rootDirectory}`)
  if (ACCESS_SCOPE.lockedFilePath) {
    console.log(`Locked file: ${ACCESS_SCOPE.lockedFilePath}`)
  }
  if (STARTUP_TARGET_ARG) {
    console.log(`Startup target: ${STARTUP_TARGET_ARG}`)
  } else {
    console.log('Startup target: default data directory')
  }
  console.log('\nPress Ctrl+C to stop\n')
})

process.on('SIGINT', () => {
  console.log('\nShutting down...')
  server.close()
  process.exit(0)
})
