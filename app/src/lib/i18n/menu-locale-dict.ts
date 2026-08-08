/**
 * 主进程/渲染进程共享的菜单标签翻译字典。
 * key 是 __DARWIN__ 下的英文原文（无 & 加速键前缀），value 是目标语言翻译。
 * Windows 下带 & 的原文（如 '&File'）会在匹配前先 strip 掉 '&' 字符后再查。
 *
 * 注意：保持 key 与 build-default-menu.ts 中写死的英文 label 对齐（大小写一致）。
 */

export type MenuLanguageCode = 'en' | 'zh-CN'

const _zhCN: Record<string, string> = {
  'GitHub Desktop': 'GitHub Desktop',
  'About GitHub Desktop Chinese': '关于 GitHub Desktop Chinese',
  'Settings…': '设置…',
  'Install Command Line Tool…': '安装命令行工具…',
  Services: '服务',
  'Hide GitHub Desktop': '隐藏 GitHub Desktop',
  'Hide Others': '隐藏其他',
  'Show All': '显示全部',
  Quit: '退出',
  'Quit GitHub Desktop': '退出 GitHub Desktop',
  File: '文件',
  Edit: '编辑',
  View: '视图',
  Repository: '仓库',
  Branch: '分支',
  Tools: '工具',
  Help: '帮助',
  'New Repository…': '新建仓库…',
  'New &repository…': '新建仓库(&R)…',
  'Add Local Repository…': '添加本地仓库…',
  'Add &local repository…': '添加本地仓库(&L)…',
  'Clone Repository…': '克隆仓库…',
  'Clo&ne repository…': '克隆仓库(&Y)…',
  'github.com': 'GitHub.com',
  'Enterprise…': '企业版…',
  '&Options…': '选项(&O)…',
  'E&xit': '退出(&X)',
  'Open in Explorer': '在资源管理器中打开',
  'Show in Explorer': '在资源管理器中显示',
  'Show in E&xplorer': '在资源管理器中显示(&X)',
  'Reveal in Finder': '在访达中显示',
  'Show in Finder': '在访达中显示',
  'Show in your File Manager': '在文件管理器中显示',
  'Open in &external editor': '在外部编辑器中打开(&E)',
  'Open in External Editor': '在外部编辑器中打开',
  'Open in &shell': '在终端中打开(&S)',
  'Open in Shell': '在终端中打开',
  'Open in Command Prompt': '在命令提示符中打开',
  'Command Prompt': '命令提示符',
  shell: '终端',
  Shell: '终端',
  'external editor': '外部编辑器',
  'External Editor': '外部编辑器',
  'View on GitHub': '在 GitHub 上查看',
  '&View on GitHub': '在 GitHub 上查看(&V)',
  'Open With…': '打开方式…',
  'Open &with…': '打开方式(&W)…',
  'Create Issue on GitHub': '在 GitHub 上创建议题',
  'Create &issue on GitHub': '在 GitHub 上创建议题(&I)',
  'New Worktree…': '新建工作树…',
  'New work&tree…': '新建工作树(&T)…',
  'Create Pull Request': '创建拉取请求',
  'Create &pull request': '创建拉取请求(&P)',
  'View Pull Request on GitHub': '在 GitHub 上查看拉取请求',
  'View &pull request on GitHub': '在 GitHub 上查看拉取请求(&P)',
  'Remove…': '移除…',
  '&Remove…': '移除(&R)…',
  Remove: '移除',
  '&Remove': '移除(&R)',
  'Repository settings…': '仓库设置…',
  '&Repository settings…': '仓库设置(&S)…',
  'Repository Settings…': '仓库设置…',
  'Show Repository State': '显示仓库状态',
  'Show Repositor&y State': '显示仓库状态(&Y)',
  Push: '推送',
  '&Push': '推送(&P)',
  Pull: '拉取',
  '&Pull': '拉取(&U)',
  Fetch: '获取',
  '&Fetch': '获取(&F)',
  'Stash All Changes…': '暂存所有修改…',
  '&Stash all changes…': '暂存所有修改(&S)…',
  'Stash All Changes': '暂存所有修改',
  '&Stash all changes': '暂存所有修改(&S)',
  'Stash &All Changes…': '暂存所有修改(&A)…',
  'Discard &All Changes…': '放弃所有修改(&A)…',
  'New Branch…': '新建分支…',
  'New &branch…': '新建分支(&B)…',
  'Rename Branch…': '重命名分支…',
  'Rena&me branch…': '重命名分支(&M)…',
  'Delete Branch…': '删除分支…',
  'Delete &branch…': '删除分支(&D)…',
  'Update from Default Branch': '从默认分支更新',
  'Up&date from default branch': '从默认分支更新(&D)',
  'Compare to Branch': '与分支比较',
  '&Compare to branch': '与分支比较(&C)',
  'Compare to Branch…': '与分支比较…',
  '&Compare to branch…': '与分支比较(&C)…',
  'Merge into Current Branch': '合并到当前分支',
  '&Merge into current branch': '合并到当前分支(&M)',
  'Squash and Merge into Current Branch': '压缩合并到当前分支',
  'S&quash and merge into current branch': '压缩合并到当前分支(&Q)',
  'Squash and Merge into Current Branch…': '压缩合并到当前分支…',
  'Squas&h and merge into current branch…': '压缩合并到当前分支(&H)…',
  'Rebase Current Branch': '变基当前分支',
  'Re&base current branch': '变基当前分支(&B)',
  'Rebase Current Branch…': '变基当前分支…',
  'R&ebase current branch…': '变基当前分支(&E)…',
  'Merge Branch into Current': '合并分支到当前分支',
  'Merge into current branch…': '合并分支到当前分支…',
  'Show the Diff': '显示差异',
  'Show the &diff': '显示差异(&D)',
  'Undo Commit': '撤销提交',
  'U&ndo commit': '撤销提交(&N)',
  Undo: '撤销',
  '&Undo': '撤销(&U)',
  Redo: '重做',
  '&Redo': '重做(&R)',
  Cut: '剪切',
  'Cu&t': '剪切(&T)',
  Copy: '复制',
  '&Copy': '复制(&C)',
  Paste: '粘贴',
  '&Paste': '粘贴(&P)',
  'Select All': '全选',
  'Select &All': '全选(&A)',
  'Select &all': '全选(&A)',
  Find: '查找',
  '&Find': '查找(&F)',
  'Show Changes': '显示修改',
  '&Changes': '修改(&C)',
  'Show History': '显示历史',
  '&History': '历史(&H)',
  'Show Repository List': '显示仓库列表',
  'Repository &list': '仓库列表(&L)',
  'Show Branches List': '显示分支列表',
  '&Branches list': '分支列表(&B)',
  'Show Worktrees List': '显示工作树列表',
  'Wor&ktrees list': '工作树列表(&K)',
  'Go to Summary': '转到摘要',
  'Go to &Summary': '转到摘要(&S)',
  '&Reload': '重新加载(&R)',
  Reload: '重新加载',
  Stop: '停止',
  'S&top': '停止(&T)',
  'Toggle Full Screen': '切换全屏',
  'Toggle &full screen': '切换全屏(&F)',
  'Reset Zoom': '重置缩放',
  'Reset zoom': '重置缩放',
  'Zoom In': '放大',
  'Zoom in': '放大',
  'Zoom Out': '缩小',
  'Zoom out': '缩小',
  'Toggle Developer Tools': '切换开发者工具',
  '&Toggle developer tools': '切换开发者工具(&T)',
  'Expand Active Resizable': '展开活动可调整大小区域',
  'Expand active resizable': '展开活动可调整大小区域',
  'Contract Active Resizable': '折叠活动可调整大小区域',
  'Contract active resizable': '折叠活动可调整大小区域',
  'Show Command &Palette': '显示命令面板(&P)',
  'Command Palette': '命令面板',
  'Show Stashed Changes': '显示暂存的修改',
  'Show Sta&shed Changes': '显示暂存的修改(&S)',
  'Sho&w stashed changes': '显示暂存的修改(&W)',
  'Hide Stashed Changes': '隐藏暂存的修改',
  'H&ide stashed changes': '隐藏暂存的修改(&I)',
  'Show Changes Filter': '显示修改筛选器',
  'Hide Changes Filter': '隐藏修改筛选器',
  'Show Toggle Chan&ges Filter': '切换修改筛选器(&G)',
  'Hide Toggle Chan&ges Filter': '隐藏修改筛选器(&G)',
  'Show Push Rejected Dialog': '显示推送被拒绝对话框',
  'Compare on GitHub': '在 GitHub 上比较',
  'Compare on &GitHub': '在 GitHub 上比较(&G)',
  'View Branch on GitHub': '在 GitHub 上查看分支',
  'View branch on GitHub': '在 GitHub 上查看分支',
  'Preview Pull Request': '预览拉取请求',
  'Preview pull request': '预览拉取请求',
  'Open Working Directory': '打开工作目录',
  'Change repository name…': '修改仓库名称…',
  Minimize: '最小化',
  Zoom: '缩放',
  'Bring All to Front': '全部置于顶层',
  Close: '关闭',
  Install: '安装',
  Uninstall: '卸载',
  'Command Line Tool': '命令行工具',
  'Select All Files': '全选文件',
  'Deselect All Files': '全部取消选择',
  'Go to Next File': '下一个文件',
  'Go to Next &File': '下一个文件(&F)',
  'Go to Previous File': '上一个文件',
  'Go to Pre&vious File': '上一个文件(&V)',
  'Find in Current View…': '在当前视图中查找…',
  'Toggle Menu Bar': '切换菜单栏',
  // 分支菜单剩余未覆盖项
  'Rename…': '重命名…',
  '&Rename…': '重命名(&R)…',
  'Delete…': '删除…',
  '&Delete…': '删除(&D)…',
  'Discard All Changes…': '放弃所有修改…',
  'Discard all changes…': '放弃所有修改…',
  'Update from default branch': '从默认分支更新',
  '&Update from default branch': '从默认分支更新(&U)',
  '&Merge into current branch…': '合并到当前分支(&M)…',
  // 帮助菜单
  'Report Issue…': '报告问题…',
  'Report issue…': '报告问题…',
  'Contact GitHub Support…': '联系 GitHub 支持…',
  '&Contact GitHub support…': '联系 GitHub 支持(&C)…',
  'Show User Guides': '查看用户指南',
  'Show Keyboard Shortcuts': '显示键盘快捷键',
  'Show keyboard shortcuts': '显示键盘快捷键',
  'Show Logs in Finder': '在 Finder 中显示日志',
  'S&how logs in Explorer': '在资源管理器中显示日志(&H)',
  'S&how logs in your File Manager': '在文件管理器中显示日志(&H)',
  'Show logs in Explorer': '在资源管理器中显示日志',
  'Show logs in your File Manager': '在文件管理器中显示日志',
  // 调试/测试菜单（帮助里的高级项）
  'Crash main process…': '崩溃主进程…',
  'Crash renderer process…': '崩溃渲染进程…',
  'Prune branches': '修剪分支',
  'Show notification': '显示通知',
  'Dispatch CLI action': '派发 CLI 动作',
  'Show popup': '显示弹窗',
  'Release notes': '发布说明',
  'Thank you': '感谢支持',
  'Show App Error': '显示应用错误',
  Octicons: '图标',
  'About dialog (test mode)': '关于对话框（测试模式）',
  'Copilot snapshot card': 'Copilot 快照卡片',
  'Show banner': '显示横幅',
  'Update banner': '更新横幅',
  'Update banner (priority)': '更新横幅（高优先级）',
  'Showcase Update banner': '展示更新横幅',
  'Apple silicon banner': 'Apple Silicon 横幅',
  'Arm64 banner': 'Arm64 横幅',
  'Reorder Successful': '重排序成功',
  'Reorder Undone': '重排序已撤销',
  'Cherry Pick Conflicts': '遴选冲突',
  'Merge Successful': '合并成功',
  'OS Version No Longer Supported': '操作系统版本不再受支持',
  'Show Error Dialogs': '显示错误对话框',
  'Confirm Committing Conflicted Files': '确认提交冲突文件',
  'Discarded Changes Will Be Unrecoverable': '已放弃的修改将无法恢复',
  'Do you want to fork this repository?': '是否要 Fork 此仓库？',
  'Newer Commits On Remote': '远程端有新的提交',
  'Files Too Large': '文件过大',
  'Generic Git Authentication': '通用 Git 认证',
  'Invalidated Account Token': '账户令牌已失效',
  'Move to Application Folder': '移动到应用程序文件夹',
  'Push Rejected': '推送被拒绝',
  'Re-Authorization Required': '需要重新授权',
  'Unable to Locate Git': '找不到 Git',
  'Unable to Open External Editor': '无法打开外部编辑器',
  'Unable to Open Shell': '无法打开终端',
  'Untrusted Server': '不受信任的服务器',
  'Update Existing Git LFS Filters?': '更新现有的 Git LFS 过滤器？',
  'Upstream Already Exists': '上游远程已存在',
}

/** 把模板化的英文菜单 "Open in ${X}" 做中文处理：
 *  Open in Command Prompt / Open in Powershell / Open in VS Code / etc.
 *  统一翻译为 "在 {{name}} 中打开"，并在前面保留加速键前缀 &O 时映射为 "在(&X)...中打开"。
 */
function postProcessMenuLabelForZhCN(raw: string): string {
  const strippedToMatch = raw.replace(/&/g, '').trim()

  // Open in / Show in / Open with...
  const openInMatch = /^Open in (.+)$/i.exec(strippedToMatch)
  if (openInMatch) {
    const target = openInMatch[1]
    const dictTarget =
      menuLabelDict['zh-CN'][target] ??
      menuLabelDict['zh-CN'][target.toLowerCase()] ??
      target
    return `在 ${dictTarget} 中打开`
  }
  return raw
}

/** 英文恒等映射（避免每次都判断语言是否为 en） */
const _en: Record<string, string> = {}

export const menuLabelDict: Record<MenuLanguageCode, Record<string, string>> = {
  en: _en,
  'zh-CN': _zhCN,
}

/** 从 labels 事件中解析出合法的菜单语言代码。system/未知默认 en。 */
export function resolveMenuLanguageCode(
  raw: string | undefined | null
): MenuLanguageCode {
  if (raw === 'zh-CN' || raw === 'zh_CN' || raw === 'zh') {
    return 'zh-CN'
  }
  if (raw === 'en' || raw === 'en_US' || raw === 'en-GB') {
    return 'en'
  }
  return 'en'
}

/**
 * 翻译单个菜单标签。
 * 策略：
 *   1. 先原样查字典（命中例如 "File" / "&File"）
 *   2. 没命中 → 去掉所有 '&' 字符再查（把 "&File" 统一成 "File"）
 *   3. 再没命中 → 尝试模板化后处理（Open in X / Show in X）
 *   4. 最后没命中 → 返回原文（保持英文）
 */
export function translateMenuLabel(
  rawLabel: string | undefined,
  lang: MenuLanguageCode
): string {
  if (rawLabel === undefined || rawLabel === null) {
    return ''
  }
  if (lang === 'en') {
    return rawLabel
  }
  const dict = menuLabelDict[lang] || {}
  if (dict[rawLabel]) {
    return dict[rawLabel]
  }
  const stripped = rawLabel.replace(/&/g, '')
  if (dict[stripped]) {
    // 保留末尾的 … 和其它标点
    return dict[stripped] + stripped.slice(rawLabel.replace(/&/g, '').length)
  }
  return postProcessMenuLabelForZhCN(rawLabel)
}

/**
 * 深度遍历整个菜单模板，把所有 label 字段应用翻译。
 * 保持模板引用，但直接原地修改 label 字段。
 */
export function applyMenuTranslations(
  template: Electron.MenuItemConstructorOptions[],
  lang: MenuLanguageCode
): Electron.MenuItemConstructorOptions[] {
  if (lang === 'en') {
    return template
  }
  for (const item of template) {
    if (typeof item.label === 'string') {
      item.label = translateMenuLabel(item.label, lang)
    }
    const sub = item.submenu as
      | Electron.MenuItemConstructorOptions[]
      | undefined
    if (Array.isArray(sub)) {
      applyMenuTranslations(sub, lang)
    }
  }
  return template
}
