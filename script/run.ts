import { join, dirname } from 'path'
import { spawn, SpawnOptions } from 'child_process'
import * as Fs from 'fs'
import { getDistPath, getExecutableName } from './dist-info'

const distPath = getDistPath()
const productName = getExecutableName()

let binaryPath = ''
if (process.platform === 'darwin') {
  binaryPath = join(
    distPath,
    `${productName}.app`,
    'Contents',
    'MacOS',
    `${productName}`
  )
} else if (process.platform === 'win32') {
  binaryPath = join(distPath, `${productName}.exe`)
} else if (process.platform === 'linux') {
  binaryPath = join(distPath, productName)
} else {
  console.error(`I dunno how to run on ${process.platform} ${process.arch} :(`)
  process.exit(1)
}

/**
 * 开发模式：把 out/ 下的编译产物复制/symlink 到 Electron 运行时的 resources/app/
 * 这样 Electron 会自动加载 resources/app/package.json → main.js。
 * 好处：不需要把 out 目录作为位置参数传给 exe，避免 custom protocol 回调时
 * Windows 把 x-github-client:// URL 当成应用路径加载（造成 Cannot find module 错误）。
 */
function ensureResourcesApp() {
  if (process.platform !== 'win32') {
    return
  }
  const resourcesDir = join(dirname(binaryPath), 'resources')
  const targetDir = join(resourcesDir, 'app')
  const outDir = join(__dirname, '..', 'out')

  try {
    // eslint-disable-next-line no-sync
    const outStat = Fs.statSync(outDir)
    if (!outStat.isDirectory()) {
      console.error(
        `[run] OUT directory missing: ${outDir}. Run compile:dev first.`
      )
      return
    }
  } catch (e) {
    console.error(
      `[run] OUT directory missing: ${outDir}. Run compile:dev first.`,
      e
    )
    return
  }

  // Create resources/app directory by linking/copying out/
  try {
    // eslint-disable-next-line no-sync
    Fs.mkdirSync(targetDir, { recursive: true })
  } catch (e) {
    // already exists
  }

  // Junction link (目录符号链接) 比复制快，Windows 下用 junction 对普通用户也可用
  try {
    // eslint-disable-next-line no-sync
    const existing = Fs.lstatSync(targetDir)
    if (existing.isSymbolicLink() || existing.isDirectory()) {
      try {
        // eslint-disable-next-line no-sync
        Fs.rmSync(targetDir, { recursive: true, force: true })
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* missing */
  }

  try {
    // junction on Windows doesn't require admin rights
    // eslint-disable-next-line no-sync
    Fs.symlinkSync(outDir, targetDir, 'junction')
    console.log(`[run] resources/app => ${outDir}`)
  } catch (e) {
    // fall back to recursive copy if junction fails
    console.log(
      `[run] junction failed (${(e as Error).message}), copy files...`
    )
    copyRecursiveSync(outDir, targetDir)
  }
}

function copyRecursiveSync(src: string, dest: string) {
  // eslint-disable-next-line no-sync
  Fs.mkdirSync(dest, { recursive: true })
  // eslint-disable-next-line no-sync
  for (const entry of Fs.readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name)
    const d = join(dest, entry.name)
    if (entry.isDirectory()) {
      copyRecursiveSync(s, d)
    } else {
      // eslint-disable-next-line no-sync
      Fs.copyFileSync(s, d)
    }
  }
}

export function run(spawnOptions: SpawnOptions) {
  try {
    // eslint-disable-next-line no-sync
    const stats = Fs.statSync(binaryPath)
    if (!stats.isFile()) {
      return null
    }
  } catch (e) {
    return null
  }

  // 确保 resources/app/ 存在（指向 out/）
  ensureResourcesApp()

  const opts = Object.assign({}, spawnOptions)

  const gitDir = 'C:\\Program Files\\Git'
  opts.env = Object.assign(opts.env || {}, process.env, {
    NODE_ENV: 'development',
    // Use system Git installation instead of dugite's embedded Git
    LOCAL_GIT_DIRECTORY: gitDir,
    GIT_EXEC_PATH: `${gitDir}\\mingw64\\libexec\\git-core`,
    // 强制 Git 所有输出 UTF-8，避免乱码（中文路径/提交信息）
    LESSCHARSET: 'utf-8',
    GIT_TERMINAL_PROMPT: '0',
  })

  // 同时显式注入 process.env，让 spawn 的子进程所有继承分支都拿到
  process.env.LOCAL_GIT_DIRECTORY = gitDir
  process.env.GIT_EXEC_PATH = `${gitDir}\\mingw64\\libexec\\git-core`
  process.env.LESSCHARSET = 'utf-8'
  process.env.GIT_TERMINAL_PROMPT = '0'

  const outDir = join(__dirname, '..', 'out')

  // Use a writable user-data dir inside the project to avoid sandboxed access
  // to %APPDATA%/GitHub Desktop-dev (blocked by sandbox restrictions).
  const projectRoot = join(__dirname, '..')
  const userDataDir = join(projectRoot, '.appdata', 'user-data')
  try {
    // eslint-disable-next-line no-sync
    Fs.mkdirSync(userDataDir, { recursive: true })
  } catch {
    /* ignore */
  }

  // NOTE: 必须显式把 out/ 当成 appPath 传给 Electron 作为第一个位置参数！
  //
  // 为什么？ 当 custom protocol 回调触发时，Windows 注册表会把 URL 作为位置参数：
  //   GitHubDesktop-dev.exe  x-github-client://oauth/...?code=...&state=...
  // 如果我们不传 out/，Electron 在没有 appPath 参数时会尝试加载 "第一个非 flag 位置参数"
  // 也就是那个 URL，于是就出现了 "Unable to find Electron app at ...?code=..." 的错误。
  // 但如果我们把 out/ 作为第一个位置参数传进去，Electron 就会优先加载 out/ 作为应用，
  // 而 protocol URL 作为第二个位置参数仅在 main.js 里的 process.argv 出现，由我们
  // 自己的 sanitizePositionalProtocolArgs + handleCommandLineArguments 处理。
  // out/ 是合法存在且可读的目录，Electron 会通过 package.json/main.js 正确加载 main.js。
  const args: string[] = [`--user-data-dir=${userDataDir}`]
  try {
    // eslint-disable-next-line no-sync
    if (Fs.statSync(outDir).isDirectory()) {
      args.push(outDir)
    }
  } catch {
    // out/ 不存在就继续，此时如果也挂了 resources/app Electron 会尝试加载它
  }

  return spawn(binaryPath, args, opts)
}
