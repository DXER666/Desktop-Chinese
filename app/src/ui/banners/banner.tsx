import * as React from 'react'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import classNames from 'classnames'
import { withTranslation, WithTranslation } from 'react-i18next'

interface IBannerProps {
  readonly id?: string
  readonly timeout?: number
  readonly dismissable?: boolean
  readonly className?: string
  readonly onDismissed: () => void
}

class BannerInternal extends React.Component<
  IBannerProps & WithTranslation,
  {}
> {
  private banner = React.createRef<HTMLDivElement>()

  private focusTimeoutId: number | null = null

  private dismissalTimeoutId: number | null = null

  public render() {
    const cn = classNames('banner', this.props.className)
    return (
      <div id={this.props.id} className={cn} ref={this.banner}>
        <div className="contents">{this.props.children}</div>
        {this.renderCloseButton()}
      </div>
    )
  }

  private renderCloseButton() {
    const { t } = this.props
    const { dismissable, onDismissed } = this.props

    if (dismissable === false) {
      return null
    }

    return (
      <div className="close">
        <button
          onClick={onDismissed}
          aria-label={t('banner.dismissAriaLabel', 'Dismiss this message')}
        >
          <Octicon symbol={octicons.x} />
        </button>
      </div>
    )
  }

  public componentDidMount() {
    this.focusTimeoutId = window.setTimeout(() => {
      this.focusOnFirstSuitableElement()
    }, 200)
    this.addDismissalFocusListeners()
  }

  public componentWillUnmount() {
    if (this.focusTimeoutId !== null) {
      window.clearTimeout(this.focusTimeoutId)
      this.focusTimeoutId = null
    }

    this.removeDismissalFocusListeners()
  }

  private focusOnFirstSuitableElement = () => {
    const target =
      this.banner.current?.querySelector('a') ||
      this.banner.current?.querySelector('button')
    target?.focus()
  }

  private addDismissalFocusListeners() {
    this.banner.current?.addEventListener('focusin', this.onFocusIn)
    this.banner.current?.addEventListener('focusout', this.onFocusOut)
  }

  private removeDismissalFocusListeners() {
    this.banner.current?.removeEventListener('focusout', this.onFocusOut)
    this.banner.current?.removeEventListener('focusin', this.onFocusIn)
  }

  private onFocusIn = () => {
    if (this.dismissalTimeoutId !== null) {
      window.clearTimeout(this.dismissalTimeoutId)
      this.dismissalTimeoutId = null
    }
  }

  private onFocusOut = async (event: FocusEvent) => {
    const { dismissable, onDismissed, timeout } = this.props

    if (
      event.relatedTarget &&
      this.banner.current?.contains(event.relatedTarget as Node)
    ) {
      return
    }

    if (dismissable !== false && timeout !== undefined) {
      this.dismissalTimeoutId = window.setTimeout(() => {
        onDismissed()
      }, timeout)
    }
  }
}

export const Banner = withTranslation()(
  BannerInternal
) as unknown as React.ComponentClass<IBannerProps>
