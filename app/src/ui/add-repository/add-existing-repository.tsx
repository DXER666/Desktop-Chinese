import * as React from 'react'
import * as Path from 'path'
import { withTranslation, WithTranslation } from 'react-i18next'
import { Dispatcher } from '../dispatcher'
import { addSafeDirectory, getRepositoryType } from '../../lib/git'
import { Button } from '../lib/button'
import { TextBox } from '../lib/text-box'
import { Row } from '../lib/row'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { PopupType } from '../../models/popup'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { FoldoutType } from '../../lib/app-state'

import untildify from 'untildify'
import { showOpenDialog } from '../main-process-proxy'
import { Ref } from '../lib/ref'
import { InputError } from '../lib/input-description/input-error'
import { IAccessibleMessage } from '../../models/accessible-message'

interface IAddExistingRepositoryProps {
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void

  /** An optional path to prefill the path text box with.
   * Defaults to the empty string if not defined.
   */
  readonly path?: string
}

interface IAddExistingRepositoryState {
  readonly path: string

  /**
   * Indicates whether or not to render a warning message about the entered path
   * not containing a valid Git repository. This value differs from `isGitRepository` in that it holds
   * its value when the path changes until we've gotten a definitive answer from the asynchronous
   * method that the path is, or isn't, a valid repository path. Separating the two means that
   * we don't toggle visibility of the warning message until it's really necessary, preventing
   * flickering for our users as they type in a path.
   */
  readonly showNonGitRepositoryWarning: boolean
  readonly isRepositoryBare: boolean
  readonly isRepositoryUnsafe: boolean
  readonly repositoryUnsafePath?: string
  readonly isTrustingRepository: boolean
}

/** The component for adding an existing local repository. */
class AddExistingRepositoryInternal extends React.Component<
  IAddExistingRepositoryProps & WithTranslation,
  IAddExistingRepositoryState
> {
  private pathTextBoxRef = React.createRef<TextBox>()

  public constructor(props: IAddExistingRepositoryProps & WithTranslation) {
    super(props)

    const path = this.props.path ? this.props.path : ''

    this.state = {
      path,
      showNonGitRepositoryWarning: false,
      isRepositoryBare: false,
      isRepositoryUnsafe: false,
      isTrustingRepository: false,
    }
  }

  private onTrustDirectory = async () => {
    this.setState({ isTrustingRepository: true })
    const { repositoryUnsafePath, path } = this.state
    if (repositoryUnsafePath) {
      await addSafeDirectory(repositoryUnsafePath)
    }
    await this.validatePath(path)
    this.setState({ isTrustingRepository: false })
  }

  private async updatePath(path: string) {
    this.setState({ path })
  }

  private async validatePath(path: string): Promise<boolean> {
    if (path.length === 0) {
      this.setState({
        isRepositoryBare: false,
        showNonGitRepositoryWarning: false,
      })
      return false
    }

    let type: Awaited<ReturnType<typeof getRepositoryType>>
    try {
      type = await getRepositoryType(path)
    } catch (err) {
      // 如果 Git 本身无法启动（例如打包后缺少 DLL），不静默：
      // 将 showNonGitRepositoryWarning 设为 true 以提示用户当前路径无效，
      // 而不是让"添加仓库"按钮看起来点不动。
      console.error('[add-existing] validatePath failed', err)
      this.setState(state =>
        path === state.path
          ? {
              isRepositoryBare: false,
              isRepositoryUnsafe: false,
              showNonGitRepositoryWarning: true,
              repositoryUnsafePath: undefined,
            }
          : null
      )
      return false
    }

    const isRepository = type.kind !== 'missing' && type.kind !== 'unsafe'
    const isRepositoryUnsafe = type.kind === 'unsafe'
    const isRepositoryBare = type.kind === 'bare'
    const showNonGitRepositoryWarning = !isRepository || isRepositoryBare
    const repositoryUnsafePath = type.kind === 'unsafe' ? type.path : undefined

    this.setState(state =>
      path === state.path
        ? {
            isRepositoryBare,
            isRepositoryUnsafe,
            showNonGitRepositoryWarning,
            repositoryUnsafePath,
          }
        : null
    )

    return path.length > 0 && isRepository && !isRepositoryBare
  }

  private buildBareRepositoryError() {
    const { t } = this.props
    if (
      !this.state.path.length ||
      !this.state.showNonGitRepositoryWarning ||
      !this.state.isRepositoryBare
    ) {
      return null
    }

    const msg = t('addExistingRepository.bareRepoError')

    return { screenReaderMessage: msg, displayedMessage: msg }
  }

  private buildRepositoryUnsafeError() {
    const { t } = this.props
    const { repositoryUnsafePath, path } = this.state
    if (
      !this.state.path.length ||
      !this.state.showNonGitRepositoryWarning ||
      !this.state.isRepositoryUnsafe ||
      repositoryUnsafePath === undefined
    ) {
      return null
    }

    // Git for Windows will replace backslashes with slashes in the error
    // message so we'll do the same to not show "the repo at path c:/repo"
    // when the entered path is `c:\repo`.
    const convertedPath = __WIN32__ ? path.replaceAll('\\', '/') : path

    const displayedMessage = (
      <>
        <p>
          {t('addExistingRepository.unsafeRepoTitle')}
          {repositoryUnsafePath !== convertedPath && (
            <>
              {' '}
              <Ref>{repositoryUnsafePath}</Ref>
            </>
          )}{' '}
          {t('addExistingRepository.unsafeRepoPart1')}
        </p>
        <p>
          {t('addExistingRepository.unsafeRepoPart2')}
          <LinkButton onClick={this.onTrustDirectory}>
            {t('addExistingRepository.unsafeRepoAddException')}
          </LinkButton>
          {t('addExistingRepository.unsafeRepoPart3')}
        </p>
      </>
    )

    const screenReaderMessage = `${t('addExistingRepository.unsafeRepoTitle')}
      ${t('addExistingRepository.unsafeRepoPart1')}
      ${t('addExistingRepository.unsafeRepoPart2')}${t('addExistingRepository.unsafeRepoAddException')}${t('addExistingRepository.unsafeRepoPart3')}`

    return { screenReaderMessage, displayedMessage }
  }

  private buildNotAGitRepositoryError(): IAccessibleMessage | null {
    const { t } = this.props
    if (!this.state.path.length || !this.state.showNonGitRepositoryWarning) {
      return null
    }

    const displayedMessage = (
      <>
        <p>{t('addExistingRepository.notGitRepo')}</p>
        <p>
          {t('addExistingRepository.createRepoInstead1')}
          <LinkButton onClick={this.onCreateRepositoryClicked}>
            {t('addExistingRepository.createRepoInstead2')}
          </LinkButton>
          {t('addExistingRepository.createRepoInstead3')}
        </p>
      </>
    )

    const screenReaderMessage =
      `${t('addExistingRepository.notGitRepo')} ${t('addExistingRepository.createRepoInstead1')}${t('addExistingRepository.createRepoInstead2')}${t('addExistingRepository.createRepoInstead3')}`

    return { screenReaderMessage, displayedMessage }
  }

  private renderErrors() {
    const msg: IAccessibleMessage | null =
      this.buildBareRepositoryError() ??
      this.buildRepositoryUnsafeError() ??
      this.buildNotAGitRepositoryError()

    if (msg === null) {
      return null
    }

    return (
      <Row>
        <InputError
          id="add-existing-repository-path-error"
          ariaLiveMessage={msg.screenReaderMessage}
        >
          {msg.displayedMessage}
        </InputError>
      </Row>
    )
  }

  public render() {
    const { t } = this.props
    return (
      <Dialog
        id="add-existing-repository"
        title={__DARWIN__ ? t('addExistingRepository.titleDarwin') : t('addExistingRepository.titleOther')}
        onSubmit={this.addRepository}
        onDismissed={this.props.onDismissed}
        loading={this.state.isTrustingRepository}
      >
        <DialogContent>
          <Row>
            <TextBox
              ref={this.pathTextBoxRef}
              value={this.state.path}
              label={__DARWIN__ ? t('addExistingRepository.localPathDarwin') : t('addExistingRepository.localPathOther')}
              placeholder={t('addExistingRepository.placeholder')}
              onValueChanged={this.onPathChanged}
              ariaDescribedBy="add-existing-repository-path-error"
            />
            <Button onClick={this.showFilePicker}>{t('addExistingRepository.chooseButton')}</Button>
          </Row>
          {this.renderErrors()}
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={__DARWIN__ ? t('addExistingRepository.okButtonDarwin') : t('addExistingRepository.okButtonOther')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onPathChanged = async (path: string) => {
    if (this.state.path !== path) {
      this.updatePath(path)
    }
  }

  private showFilePicker = async () => {
    const path = await showOpenDialog({
      properties: ['createDirectory', 'openDirectory'],
    })

    if (path === null) {
      return
    }

    this.updatePath(path)
  }

  private resolvedPath(path: string): string {
    return Path.resolve('/', untildify(path))
  }

  private addRepository = async () => {
    const { path } = this.state
    const isValidPath = await this.validatePath(path)

    if (!isValidPath) {
      this.pathTextBoxRef.current?.focus()
      return
    }

    this.props.onDismissed()
    const { dispatcher } = this.props

    const resolvedPath = this.resolvedPath(path)
    const repositories = await dispatcher.addRepositories([resolvedPath])

    if (repositories.length > 0) {
      dispatcher.closeFoldout(FoldoutType.Repository)
      dispatcher.selectRepository(repositories[0])
      dispatcher.recordAddExistingRepository()
    }
  }

  private onCreateRepositoryClicked = () => {
    this.props.onDismissed()

    const resolvedPath = this.resolvedPath(this.state.path)

    return this.props.dispatcher.showPopup({
      type: PopupType.CreateRepository,
      path: resolvedPath,
    })
  }
}

/**
 * 用 withTranslation 包装后导出的添加本地仓库对话框组件。
 */
export const AddExistingRepository = withTranslation()(
  AddExistingRepositoryInternal
) as React.ComponentClass<IAddExistingRepositoryProps>
