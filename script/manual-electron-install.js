const { downloadArtifact } = require('@electron/get')
const extract = require('extract-zip')
const fs = require('fs')
const path = require('path')

const version = '42.0.1'
const platform = 'win32'
const arch = 'x64'
const electronRoot = path.join(__dirname, '..', 'node_modules', 'electron')
const distPath = path.join(electronRoot, 'dist')

async function main() {
  console.log(`Downloading electron v${version} ${platform}-${arch}...`)
  console.log(`ELECTRON_MIRROR=${process.env.ELECTRON_MIRROR}`)

  const zipPath = await downloadArtifact({
    version,
    artifactName: 'electron',
    force: true,
    platform,
    arch,
  })
  console.log(`Downloaded zip: ${zipPath}`)

  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true })
  }

  console.log(`Extracting to ${distPath}...`)
  await extract(zipPath, { dir: distPath })
  console.log('Extract done!')

  const exePath = path.join(distPath, 'electron.exe')
  console.log(`electron.exe exists: ${fs.existsSync(exePath)}`)

  if (fs.existsSync(exePath)) {
    fs.writeFileSync(path.join(electronRoot, 'path.txt'), 'electron.exe')
    console.log('path.txt updated')
  }
}

main().catch(err => {
  console.error('ERROR:', err)
  process.exit(1)
})
