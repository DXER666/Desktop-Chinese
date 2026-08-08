import * as React from 'react'
import * as Path from 'path'

import { Repository } from '../../models/repository'

import { LinkButton } from '../lib/link-button'
import { withTranslation, WithTranslation } from 'react-i18next'

interface IBinaryFileProps {
  readonly repository: Repository
  readonly path: string
  /**
   * Called when the user requests to open a binary file in an the
   * system-assigned application for said file type.
   */
  readonly onOpenBinaryFile: (fullPath: string) => void
}

/** represents the default view for a file that we cannot render a diff for */
class BinaryFileInternal extends React.Component<
  IBinaryFileProps & WithTranslation,
  {}
> {
  private open = () => {
    const fullPath = Path.join(this.props.repository.path, this.props.path)
    this.props.onOpenBinaryFile(fullPath)
  }

  public render() {
    const { t } = this.props
    return (
      <div className="panel binary" id="diff">
        <div className="image-header">
          {t('binaryFile.hasChanged', 'This binary file has changed.')}
        </div>
        <div className="image-header">
          <LinkButton onClick={this.open}>
            {t(
              'binaryFile.openInExternalProgram',
              'Open file in external program.'
            )}
          </LinkButton>
        </div>
      </div>
    )
  }
}

export const BinaryFile = withTranslation()(
  BinaryFileInternal
) as unknown as React.ComponentClass<IBinaryFileProps>
