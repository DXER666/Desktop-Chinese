import {
  exec,
  GitError as DugiteError,
  parseError,
  IGitResult as DugiteResult,
  IGitExecutionOptions as DugiteExecutionOptions,
  parseBadConfigValueErrorInfo,
  ExecError,
} from 'dugite'

import { assertNever } from '../fatal-error'
import * as GitPerf from '../../ui/lib/git-perf'
import * as Path from 'path'
import * as Fs from 'fs'
import * as ChildProcess from 'child_process'
import { isErrnoException } from '../errno-exception'
import { withTrampolineEnv } from '../trampoline/trampoline-environment'
import { kStringMaxLength } from 'buffer'
import { withHooksEnv } from '../hooks/with-hooks-env'
import { coerceToString } from './coerce-to-string'
import { pushTerminalChunk } from './push-terminal-chunk'
import i18n from '../i18n'

/**
 * 渲染进程中 dugite 内部的 resolveGitBinary 默认会读 process.env.LOCAL_GIT_DIRECTORY，
 * 而渲染进程里 process.env 可能是空的，导致 dugite 去错误的嵌入式目录找 Git，抛出 ENOENT。
 *
 * 修复策略：
 *  1) 只要这个模块一加载就立刻做一次 bootstrap（而不是等第一次 git() 调用），
 *     确保 dugite 第一次 import 或内部调用 resolveGitBinary 前 process.env 已经有值。
 *  2) 在配置 Git 路径前用 `where git` / `stat` 验证路径确实存在，
 *     不存在时走更多 fallback 兜底。
 *  3) 除了把环境变量写入 process.env，也要作为每个 exec 调用的 options.env
 *     传入，确保 dugite 内部 spawn 的子进程能拿到。
 */

/**
 * 如果系统 PATH 里有 git.exe（where git 能找到），就反推出它的
 * LOCAL_GIT_DIRECTORY 根目录。
 */
function findSystemGitDirFromWhere(): string | null {
  try {
    const out = ChildProcess.execSync('where git', {
      encoding: 'utf-8',
      windowsHide: true,
    })
      .toString()
      .split(/\r?\n/)
      .map(l => l.trim())
      .find(l => l.length > 0)
    if (!out || !Fs.existsSync(out)) {
      return null
    }
    // git.exe 一般在 <install>\\cmd\\git.exe 或 <install>\\bin\\git.exe
    // 我们向上走 1-2 层找 mingw64/ 子目录来确认根目录
    let dir = Path.dirname(out)
    for (let i = 0; i < 3; i++) {
      try {
        if (
          Fs.statSync(Path.join(dir, 'mingw64', 'libexec', 'git-core'))
            .isDirectory()
        ) {
          return dir
        }
      } catch {
        /* not root */
      }
      dir = Path.dirname(dir)
      if (!dir || dir === Path.dirname(dir)) {
        break
      }
    }
    return null
  } catch {
    return null
  }
}

let gitEnvBootstrapped = false
function bootstrapGitEnvIntoProcess(): Record<string, string> {
  const w = typeof window !== 'undefined' ? (window as any) : null
  // 内置 git 优先于系统 git：内置版本包含 git-credential-desktop.exe 等
  // GitHub Desktop 专用工具，使用系统 git 时容易因缺少该 helper 报错。
  const bundledGitDir = Path.resolve(__dirname, 'git')
  const candidates: Array<string | null | undefined> = [
    w?.__LOCAL_GIT_DIRECTORY,
    w?.LOCAL_GIT_DIRECTORY,
    process.env.LOCAL_GIT_DIRECTORY,
    bundledGitDir,
    findSystemGitDirFromWhere(),
    'C:\\Program Files\\Git',
    'C:\\Program Files (x86)\\Git',
    `${process.env.ProgramW6432 || 'C:\\Program Files'}\\Git`,
  ]

  let gitDir: string | null = null
  for (const c of candidates) {
    if (!c) continue
    try {
      if (Fs.statSync(c).isDirectory()) {
        const execPath = Path.join(c, 'mingw64', 'libexec', 'git-core')
        try {
          if (Fs.statSync(execPath).isDirectory()) {
            gitDir = c
            break
          }
        } catch {
          /* keep looking */
        }
      }
    } catch {
      /* keep looking */
    }
  }

  const result: Record<string, string> = {}
  if (gitDir) {
    result.LOCAL_GIT_DIRECTORY = gitDir
    result.GIT_EXEC_PATH = Path.join(gitDir, 'mingw64', 'libexec', 'git-core')
    // 修正 dugite 的 PATH 设置：dugite 默认只会加 `{gitDir}/mingw64/usr/bin`
    // 和 `{gitDir}/mingw64/bin`，但实际打包后 msys-2.0.dll 在 `{gitDir}/usr/bin`。
    // 缺少这些 DLL 会导致启动 git.exe 时返回 0xC0000135 (STATUS_DLL_NOT_FOUND / 3221225781)
    // 使得克隆、添加本地仓库、rev-parse 等任何调用 git 的操作静默失败。
    const mingwBin = Path.join(gitDir, 'mingw64', 'bin')
    const usrBin = Path.join(gitDir, 'usr', 'bin')
    const mingwUsrBin = Path.join(gitDir, 'mingw64', 'usr', 'bin')
    const usrLibexecCore = Path.join(gitDir, 'mingw64', 'libexec', 'git-core')
    const existingPath = process.env.PATH || ''
    result.PATH = [
      mingwBin,
      usrBin,
      mingwUsrBin,
      usrLibexecCore,
      existingPath,
    ]
      .filter(p => !!p)
      .join(Path.delimiter)
  }
  result.LESSCHARSET =
    w?.__LESSCHARSET || process.env.LESSCHARSET || 'utf-8'
  result.GIT_TERMINAL_PROMPT =
    w?.__GIT_TERMINAL_PROMPT || process.env.GIT_TERMINAL_PROMPT || '0'

  if (!gitEnvBootstrapped) {
    for (const [k, v] of Object.entries(result)) {
      if (v && !process.env[k]) {
        process.env[k] = v
      }
    }
    gitEnvBootstrapped = true
    if (__DEV__) {
      console.log(
        `[git-env] bootstrapped: LOCAL_GIT_DIRECTORY=${result.LOCAL_GIT_DIRECTORY || 'NOT FOUND'}, GIT_EXEC_PATH=${result.GIT_EXEC_PATH || 'NOT FOUND'}`
      )
    }
  }
  return result
}

// 加载这个模块就立刻做一次，确保 dugite 内部 resolveGitBinary 默认参数能读到
bootstrapGitEnvIntoProcess()

export const isMaxBufferExceededError = (
  error: unknown
): error is ExecError & { code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' } => {
  return (
    error instanceof ExecError &&
    error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'
  )
}

export type TerminalOutput = string | Buffer | Buffer[]

export type TerminalOutputListener = (cb: (chunk: TerminalOutput) => void) => {
  unsubscribe: () => void
}

export type TerminalOutputCallback = (subscribe: TerminalOutputListener) => void

export type HookProgress = {
  readonly hookName: string
} & (
  | {
      readonly status: 'started'
      readonly abort: () => void
    }
  | {
      readonly status: 'finished' | 'failed'
    }
)

export type HookCallbackOptions = {
  readonly onHookProgress?: (progress: HookProgress) => void
  readonly onHookFailure?: (
    hookName: string,
    terminalOutput: TerminalOutput
  ) => Promise<'abort' | 'ignore'>
  readonly onTerminalOutputAvailable?: TerminalOutputCallback
}

/**
 * An extension of the execution options in dugite that
 * allows us to piggy-back our own configuration options in the
 * same object.
 */
export interface IGitExecutionOptions
  extends HookCallbackOptions,
    DugiteExecutionOptions {
  /**
   * The exit codes which indicate success to the
   * caller. Unexpected exit codes will be logged and an
   * error thrown. Defaults to 0 if undefined.
   */
  readonly successExitCodes?: ReadonlySet<number>

  /**
   * The git errors which are expected by the caller. Unexpected errors will
   * be logged and an error thrown.
   */
  readonly expectedErrors?: ReadonlySet<DugiteError>

  /** Should it track & report LFS progress? */
  readonly trackLFSProgress?: boolean

  /**
   * Whether the command about to run is part of a background task or not.
   * This affects error handling and UI such as credential prompts.
   */
  readonly isBackgroundTask?: boolean

  readonly interceptHooks?: string[]
}

/**
 * The result of using `git`. This wraps dugite's results to provide
 * the parsed error if one occurs.
 */
export interface IGitResult extends DugiteResult {
  /**
   * The parsed git error. This will be null when the exit code is included in
   * the `successExitCodes`, or when dugite was unable to parse the
   * error.
   */
  readonly gitError: DugiteError | null

  /** The human-readable error description, based on `gitError`. */
  readonly gitErrorDescription: string | null

  /**
   * The path that the Git command was executed from, i.e. the
   * process working directory (not to be confused with the Git
   * working directory which is... super confusing, I know)
   */
  readonly path: string
}

/** The result of shelling out to git using a string encoding (default) */
export interface IGitStringResult extends IGitResult {
  /** The standard output from git. */
  readonly stdout: string

  /** The standard error output from git. */
  readonly stderr: string
}

export interface IGitStringExecutionOptions extends IGitExecutionOptions {
  readonly encoding?: BufferEncoding
}

export interface IGitBufferExecutionOptions extends IGitExecutionOptions {
  readonly encoding: 'buffer'
}

/** The result of shelling out to git using a buffer encoding */
export interface IGitBufferResult extends IGitResult {
  /** The standard output from git. */
  readonly stdout: Buffer

  /** The standard error output from git. */
  readonly stderr: Buffer
}

export class GitError extends Error {
  /** The result from the failed command. */
  public readonly result: IGitResult

  /** The args for the failed command. */
  public readonly args: ReadonlyArray<string>

  /**
   * Whether or not the error message is just the raw output of the git command.
   */
  public readonly isRawMessage: boolean

  public constructor(
    result: IGitResult,
    args: ReadonlyArray<string>,
    terminalOutput: string
  ) {
    let rawMessage = true
    let message

    if (result.gitErrorDescription) {
      message = result.gitErrorDescription
      rawMessage = false
    } else if (terminalOutput.length > 0) {
      message = terminalOutput
    } else if (result.stderr.length) {
      message = coerceToString(result.stderr)
    } else if (result.stdout.length) {
      message = coerceToString(result.stdout)
    } else {
      message = i18n.t('gitError.unknownExitCode', {
        exitCode: result.exitCode,
      })
      rawMessage = false
    }

    super(message)

    this.name = 'GitError'
    this.result = result
    this.args = args
    this.isRawMessage = rawMessage
  }
}

export const isGitError = (
  e: unknown,
  parsedError?: DugiteError
): e is GitError => {
  return (
    e instanceof GitError &&
    (parsedError === undefined || e.result.gitError === parsedError)
  )
}

/**
 * Shell out to git with the given arguments, at the given path.
 *
 * @param args             The arguments to pass to `git`.
 *
 * @param path             The working directory path for the execution of the
 *                         command.
 *
 * @param name             The name for the command based on its caller's
 *                         context. This will be used for performance
 *                         measurements and debugging.
 *
 * @param options          Configuration options for the execution of git,
 *                         see IGitExecutionOptions for more information.
 *
 * Returns the result. If the command exits with a code not in
 * `successExitCodes` or an error not in `expectedErrors`, a `GitError` will be
 * thrown.
 */
export async function git(
  args: string[],
  path: string,
  name: string,
  options?: IGitStringExecutionOptions
): Promise<IGitStringResult>
export async function git(
  args: string[],
  path: string,
  name: string,
  options?: IGitBufferExecutionOptions
): Promise<IGitBufferResult>
export async function git(
  args: string[],
  path: string,
  name: string,
  options?: IGitExecutionOptions
): Promise<IGitResult> {
  const defaultOptions: IGitExecutionOptions = {
    successExitCodes: new Set([0]),
    expectedErrors: new Set(),
    maxBuffer: options?.encoding === 'buffer' ? Infinity : kStringMaxLength,
  }

  const opts = { ...defaultOptions, ...options }

  // The combined contents of stdout and stderr with some light processing
  // applied to remove redundant lines caused by Git's use of `\r` to "erase"
  // the current line while writing progress output. See createTerminalOutput.
  //
  // Note: The output is capped at a maximum of 256kb and the sole intent of
  // this property is to provide "terminal-like" output to the user when a Git
  // command fails.
  const terminalChunks: string[] = []
  const terminalCapacity = 256 * 1024

  // Keep at most 256kb of combined stderr and stdout output. This is used
  // to provide more context in error messages.
  opts.processCallback = process => {
    options?.onTerminalOutputAvailable?.(function (cb) {
      terminalChunks.forEach(chunk => cb(chunk))

      process.stdout?.on('data', cb)
      process.stderr?.on('data', cb)

      return {
        unsubscribe: () => {
          process.stdout?.off('data', cb)
          process.stderr?.off('data', cb)
        },
      }
    })

    const push = (chunk: Buffer | string) => {
      pushTerminalChunk(terminalChunks, terminalCapacity, chunk)
    }

    process.stdout?.on('data', push)
    process.stderr?.on('data', push)

    options?.processCallback?.(process)
  }

  return withHooksEnv(
    hooksEnv =>
      withTrampolineEnv(
        async env => {
          const commandName = `${name}: git ${args.join(' ')}`

          // 先把 Git 路径等一次性写入 process.env，确保 dugite 内部的
          // resolveGitBinary 默认参数 (= process.env.LOCAL_GIT_DIRECTORY)
          // 能读到正确值，从根本上解决 ENOENT 问题
          const gitEnv = bootstrapGitEnvIntoProcess()
          const result = await GitPerf.measure(commandName, () =>
            exec(args, path, {
              ...opts,
              env: {
                // Explicitly set TERM to 'dumb' so that if Desktop was launched
                // from a terminal or if the system environment variables
                // have TERM set Git won't consider us as a smart terminal.
                // See https://github.com/git/git/blob/a7312d1a2/editor.c#L11-L15
                TERM: 'dumb',
                ...opts.env,
                ...hooksEnv,
                ...env,
                ...gitEnv,
              },
            })
          ).catch(err => {
            // If this is an exception thrown by Node.js (as opposed to
            // dugite) let's keep the salient details but include the name of
            // the operation.
            if (isErrnoException(err)) {
              throw new Error(`Failed to execute ${name}: ${err.code}`)
            }

            if (isMaxBufferExceededError(err)) {
              throw new ExecError(
                `${err.message} for ${name}`,
                err.stdout,
                err.stderr,
                // Dugite stores the original Node error in the cause property, by
                // passing that along we ensure that all we're doing here is
                // changing the error message (and capping the stack but that's
                // okay since we know exactly where this error is coming from).
                // The null coalescing here is a safety net in case dugite's
                // behavior changes from underneath us.
                err.cause ?? err
              )
            }

            throw err
          })

          const exitCode = result.exitCode

          let gitError: DugiteError | null = null
          const acceptableExitCode = opts.successExitCodes
            ? opts.successExitCodes.has(exitCode)
            : false
          if (!acceptableExitCode) {
            gitError = parseError(coerceToString(result.stderr))
            if (gitError === null) {
              gitError = parseError(coerceToString(result.stdout))
            }
          }

          const gitErrorDescription =
            gitError !== null
              ? getDescriptionForError(gitError, coerceToString(result.stderr))
              : null
          const gitResult = {
            ...result,
            gitError,
            gitErrorDescription,
            path,
          }

          let acceptableError = true
          if (gitError !== null && opts.expectedErrors) {
            acceptableError = opts.expectedErrors.has(gitError)
          }

          if ((gitError !== null && acceptableError) || acceptableExitCode) {
            return gitResult
          }

          // The caller should either handle this error, or expect that exit code.
          const errorMessage = new Array<string>()
          errorMessage.push(
            `\`git ${args.join(
              ' '
            )}\` exited with an unexpected code: ${exitCode}.`
          )

          const terminalOutput = terminalChunks.join('')

          if (terminalOutput.length > 0) {
            // Leave even less of the combined output in the log
            errorMessage.push(terminalOutput.slice(-1024))
          }

          if (gitError !== null) {
            errorMessage.push(
              `(The error was parsed as ${gitError}: ${gitErrorDescription})`
            )
          }

          log.error(errorMessage.join('\n'))

          throw new GitError(gitResult, args, terminalOutput)
        },
        path,
        options?.isBackgroundTask ?? false,
        hooksEnv
      ),
    path,
    options
  )
}

/**
 * Determine whether the provided `error` is an authentication failure
 * as per our definition. Note that this is not an exhaustive list of
 * authentication failures, only a collection of errors that we treat
 * equally in terms of error message and presentation to the user.
 */
export function isAuthFailureError(
  error: DugiteError
): error is
  | DugiteError.SSHAuthenticationFailed
  | DugiteError.SSHPermissionDenied
  | DugiteError.HTTPSAuthenticationFailed {
  switch (error) {
    case DugiteError.SSHAuthenticationFailed:
    case DugiteError.SSHPermissionDenied:
    case DugiteError.HTTPSAuthenticationFailed:
      return true
  }
  return false
}

/**
 * Determine whether the provided `error` is an error from Git indicating
 * that a configuration file  write failed due to a lock file already
 * existing for that config file.
 */
export function isConfigFileLockError(error: Error): error is GitError {
  return (
    error instanceof GitError &&
    error.result.gitError === DugiteError.ConfigLockFileAlreadyExists
  )
}

const lockFilePathRe = /^error: could not lock config file (.+?): File exists$/m

/**
 * If the `result` is associated with an config lock file error (as determined
 * by `isConfigFileLockError`) this method will attempt to extract an absolute
 * path (i.e. rooted) to the configuration lock file in question from the Git
 * output.
 */
export function parseConfigLockFilePathFromError(result: IGitResult) {
  const match = lockFilePathRe.exec(coerceToString(result.stderr))

  if (match === null) {
    return null
  }

  // Git on Windows may print the config file path using forward slashes.
  // Luckily for us forward slashes are not allowed in Windows file or
  // directory names so we can simply replace any instance of forward
  // slashes with backslashes.
  const normalized = __WIN32__ ? match[1].replace('/', '\\') : match[1]

  // https://github.com/git/git/blob/232378479/lockfile.h#L117-L119
  return Path.resolve(result.path, `${normalized}.lock`)
}

export function getDescriptionForError(
  error: DugiteError,
  stderr: string
): string | null {
  if (isAuthFailureError(error)) {
    const menuHint = __DARWIN__
      ? 'GitHub Desktop > Settings.'
      : 'File > Options.'
    return i18n.t('gitError.authFailed', { menuHint })
  }

  switch (error) {
    case DugiteError.BadConfigValue:
      const errorInfo = parseBadConfigValueErrorInfo(stderr)
      if (errorInfo === null) {
        return i18n.t('gitError.badConfigValueGeneric')
      }

      return i18n.t('gitError.badConfigValue', {
        key: errorInfo.key,
        value: errorInfo.value,
      })
    case DugiteError.SSHKeyAuditUnverified:
      return i18n.t('gitError.sshKeyAuditUnverified')
    case DugiteError.RemoteDisconnection:
      return i18n.t('gitError.remoteDisconnection')
    case DugiteError.HostDown:
      return i18n.t('gitError.hostDown')
    case DugiteError.RebaseConflicts:
      return i18n.t('gitError.rebaseConflicts')
    case DugiteError.MergeConflicts:
      return i18n.t('gitError.mergeConflicts')
    case DugiteError.HTTPSRepositoryNotFound:
    case DugiteError.SSHRepositoryNotFound:
      return i18n.t('gitError.repositoryNotFound')
    case DugiteError.PushNotFastForward:
      return i18n.t('gitError.pushNotFastForward')
    case DugiteError.BranchDeletionFailed:
      return i18n.t('gitError.branchDeletionFailed')
    case DugiteError.DefaultBranchDeletionFailed:
      return i18n.t('gitError.defaultBranchDeletionFailed')
    case DugiteError.RevertConflicts:
      return i18n.t('gitError.revertConflicts')
    case DugiteError.EmptyRebasePatch:
      return i18n.t('gitError.emptyRebasePatch')
    case DugiteError.NoMatchingRemoteBranch:
      return i18n.t('gitError.noMatchingRemoteBranch')
    case DugiteError.NothingToCommit:
      return i18n.t('gitError.nothingToCommit')
    case DugiteError.NoSubmoduleMapping:
      return i18n.t('gitError.noSubmoduleMapping')
    case DugiteError.SubmoduleRepositoryDoesNotExist:
      return i18n.t('gitError.submoduleRepoDoesNotExist')
    case DugiteError.InvalidSubmoduleSHA:
      return i18n.t('gitError.invalidSubmoduleSha')
    case DugiteError.LocalPermissionDenied:
      return i18n.t('gitError.localPermissionDenied')
    case DugiteError.InvalidMerge:
      return i18n.t('gitError.invalidMerge')
    case DugiteError.InvalidRebase:
      return i18n.t('gitError.invalidRebase')
    case DugiteError.NonFastForwardMergeIntoEmptyHead:
      return i18n.t('gitError.nonFastForwardMergeEmptyHead')
    case DugiteError.PatchDoesNotApply:
      return i18n.t('gitError.patchDoesNotApply')
    case DugiteError.BranchAlreadyExists:
      return i18n.t('gitError.branchAlreadyExists')
    case DugiteError.BadRevision:
      return i18n.t('gitError.badRevision')
    case DugiteError.NotAGitRepository:
      return i18n.t('gitError.notAGitRepository')
    case DugiteError.ProtectedBranchForcePush:
      return i18n.t('gitError.protectedBranchForcePush')
    case DugiteError.ProtectedBranchRequiresReview:
      return i18n.t('gitError.protectedBranchRequiresReview')
    case DugiteError.PushWithFileSizeExceedingLimit:
      return i18n.t('gitError.pushFileSizeExceedingLimit')
    case DugiteError.HexBranchNameRejected:
      return i18n.t('gitError.hexBranchNameRejected')
    case DugiteError.ForcePushRejected:
      return i18n.t('gitError.forcePushRejected')
    case DugiteError.InvalidRefLength:
      return i18n.t('gitError.invalidRefLength')
    case DugiteError.CannotMergeUnrelatedHistories:
      return i18n.t('gitError.cannotMergeUnrelatedHistories')
    case DugiteError.PushWithPrivateEmail:
      return i18n.t('gitError.pushWithPrivateEmail')
    case DugiteError.LFSAttributeDoesNotMatch:
      return i18n.t('gitError.lfsAttributeDoesNotMatch')
    case DugiteError.ProtectedBranchDeleteRejected:
      return i18n.t('gitError.protectedBranchDeleteRejected')
    case DugiteError.ProtectedBranchRequiredStatus:
      return i18n.t('gitError.protectedBranchRequiredStatus')
    case DugiteError.BranchRenameFailed:
      return i18n.t('gitError.branchRenameFailed')
    case DugiteError.PathDoesNotExist:
      return i18n.t('gitError.pathDoesNotExist')
    case DugiteError.InvalidObjectName:
      return i18n.t('gitError.invalidObjectName')
    case DugiteError.OutsideRepository:
      return i18n.t('gitError.outsideRepository')
    case DugiteError.LockFileAlreadyExists:
      return i18n.t('gitError.lockFileAlreadyExists')
    case DugiteError.NoMergeToAbort:
      return i18n.t('gitError.noMergeToAbort')
    case DugiteError.NoExistingRemoteBranch:
      return i18n.t('gitError.noExistingRemoteBranch')
    case DugiteError.LocalChangesOverwritten:
      return i18n.t('gitError.localChangesOverwritten')
    case DugiteError.UnresolvedConflicts:
      return i18n.t('gitError.unresolvedConflicts')
    case DugiteError.ConfigLockFileAlreadyExists:
      return null
    case DugiteError.RemoteAlreadyExists:
      return null
    case DugiteError.TagAlreadyExists:
      return i18n.t('gitError.tagAlreadyExists')
    case DugiteError.MergeWithLocalChanges:
    case DugiteError.RebaseWithLocalChanges:
    case DugiteError.GPGFailedToSignData:
    case DugiteError.ConflictModifyDeletedInBranch:
    case DugiteError.MergeCommitNoMainlineOption:
    case DugiteError.UnsafeDirectory:
    case DugiteError.PathExistsButNotInRef:
    case DugiteError.PushWithSecretDetected:
      return null
    default:
      return assertNever(error, `Unknown error: ${error}`)
  }
}

/**
 * Returns the arguments to use on any git operation that can end up
 * triggering a rebase.
 */
export function gitRebaseArguments() {
  return [
    // Explicitly set the rebase backend to merge.
    // We need to force this option to be sure that Desktop
    // uses the merge backend even if the user has the apply backend
    // configured, since this is the only one supported.
    // This can go away once git deprecates the apply backend.
    ...['-c', 'rebase.backend=merge'],
  ]
}

/**
 * Returns the SHA of the passed in IGitResult
 */
export function parseCommitSHA(result: IGitStringResult): string {
  return result.stdout.split(']')[0].split(' ')[1]
}
