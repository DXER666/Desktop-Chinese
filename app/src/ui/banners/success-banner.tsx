import * as React from 'react'
import { LinkButton } from '../lib/link-button'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { Banner } from './banner'
import { withTranslation, WithTranslation } from 'react-i18next'

interface ISuccessBannerProps {
  readonly timeout: number
  readonly onDismissed: () => void
  readonly onUndo?: () => void
}

class SuccessBannerInternal extends React.Component<
  ISuccessBannerProps & WithTranslation,
  {}
> {
  private undo = () => {
    this.props.onDismissed()

    if (this.props.onUndo === undefined) {
      return
    }

    this.props.onUndo()
  }

  private renderUndo = () => {
    const { t } = this.props
    if (this.props.onUndo === undefined) {
      return
    }
    return (
      <LinkButton onClick={this.undo}>{t('banner.undo', 'Undo')}</LinkButton>
    )
  }

  public render() {
    return (
      <Banner
        id="successful"
        timeout={this.props.timeout}
        onDismissed={this.props.onDismissed}
      >
        <div className="green-circle">
          <Octicon className="check-icon" symbol={octicons.checkCircleFill} />
        </div>
        <div className="banner-message">
          <span className="success-contents">{this.props.children}</span>
          {this.renderUndo()}
        </div>
      </Banner>
    )
  }
}

export const SuccessBanner = withTranslation()(
  SuccessBannerInternal
) as unknown as React.ComponentClass<ISuccessBannerProps>
