import * as React from 'react'
import { withTranslation, WithTranslation } from 'react-i18next'
import { TextBox } from '../lib/text-box'
import { Button } from '../lib/button'
import { Row } from '../lib/row'
import { DialogContent } from '../dialog'
import { Ref } from '../lib/ref'

interface ICloneGenericRepositoryProps {
  /** The URL to clone. */
  readonly url: string

  /** The path to which the repository should be cloned. */
  readonly path: string

  /** Called when the destination path changes. */
  readonly onPathChanged: (path: string) => void

  /** Called when the URL to clone changes. */
  readonly onUrlChanged: (url: string) => void

  /**
   * Called when the user should be prompted to choose a directory to clone to.
   */
  readonly onChooseDirectory: () => Promise<string | undefined>
}

/** The component for cloning a repository. */
class CloneGenericRepositoryInternal extends React.Component<
  ICloneGenericRepositoryProps & WithTranslation,
  {}
> {
  public render() {
    const { t } = this.props
    return (
      <DialogContent className="clone-generic-repository-content">
        <Row>
          <TextBox
            placeholder={t('cloneRepository.urlPlaceholder')}
            value={this.props.url}
            onValueChanged={this.onUrlChanged}
            autoFocus={true}
            label={
              <div className="clone-url-textbox-label">
                <p>{t('cloneRepository.urlLabelLine1')}</p>
                <p>
                  (<Ref>hubot/cool-repo</Ref>)
                </p>
              </div>
            }
          />
        </Row>

        <Row>
          <TextBox
            value={this.props.path}
            label={__DARWIN__ ? t('cloneRepository.localPathDarwin') : t('cloneRepository.localPathOther')}
            placeholder={t('cloneRepository.pathPlaceholder')}
            onValueChanged={this.props.onPathChanged}
          />
          <Button onClick={this.props.onChooseDirectory}>
            {t('cloneRepository.chooseButton')}
          </Button>
        </Row>
      </DialogContent>
    )
  }

  private onUrlChanged = (url: string) => {
    this.props.onUrlChanged(url)
  }
}

/**
 * 用 withTranslation 包装后导出的通用 URL 克隆子组件。
 */
export const CloneGenericRepository = withTranslation()(
  CloneGenericRepositoryInternal
) as React.ComponentClass<ICloneGenericRepositoryProps>
