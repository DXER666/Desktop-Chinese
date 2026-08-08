import React from 'react'
import { Button } from '../lib/button'
import { Octicon, syncClockwise } from '../octicons'
import {
  DropdownItem,
  DropdownItemClassName,
  DropdownItemType,
  forcePushIcon,
} from './push-pull-button'
import { withTranslation, WithTranslation } from 'react-i18next'

interface IPushPullButtonDropDownProps {
  readonly itemTypes: ReadonlyArray<DropdownItemType>
  /** The name of the remote. */
  readonly remoteName: string | null

  /** Will the app prompt the user to confirm a force push? */
  readonly askForConfirmationOnForcePush: boolean

  readonly fetch: () => void
  readonly forcePushWithLease: () => void
}

class PushPullButtonDropDownImpl extends React.Component<
  IPushPullButtonDropDownProps & WithTranslation
> {
  private buttonsContainerRef: HTMLDivElement | null = null

  public componentDidMount() {
    window.addEventListener('keydown', this.onDropdownKeyDown)
  }

  public componentWillUnmount() {
    window.removeEventListener('keydown', this.onDropdownKeyDown)
  }

  private onButtonsContainerRef = (ref: HTMLDivElement | null) => {
    this.buttonsContainerRef = ref
  }

  private onDropdownKeyDown = (event: KeyboardEvent) => {
    // Allow using Up and Down arrow keys to navigate the dropdown items
    // (equivalent to Tab and Shift+Tab)
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return
    }

    event.preventDefault()
    const items = this.buttonsContainerRef?.querySelectorAll<HTMLElement>(
      `.${DropdownItemClassName}`
    )

    if (items === undefined) {
      return
    }

    const focusedItem =
      this.buttonsContainerRef?.querySelector<HTMLElement>(':focus')
    if (!focusedItem) {
      return
    }

    const focusedIndex = Array.from(items).indexOf(focusedItem)
    const nextIndex =
      event.key === 'ArrowDown' ? focusedIndex + 1 : focusedIndex - 1
    // http://javascript.about.com/od/problemsolving/a/modulobug.htm
    const nextItem = items[(nextIndex + items.length) % items.length]
    nextItem?.focus()
  }

  private getDropdownItemWithType(type: DropdownItemType): DropdownItem {
    const { remoteName, t } = this.props

    switch (type) {
      case DropdownItemType.Fetch:
        return {
          title: t('pushPullButton.fetchTitle', { remoteName }),
          description: t('pushPullButton.fetchDescription', { remoteName }),
          action: this.props.fetch,
          icon: syncClockwise,
        }
      case DropdownItemType.ForcePush: {
        const forcePushWarning = this.props
          .askForConfirmationOnForcePush ? null : (
          <div className="warning">
            <span className="warning-title">
              {t('pushPullButton.forcePushWarningTitle')}
            </span>
            {t('pushPullButton.forcePushWarningBody')}
          </div>
        )
        return {
          title: t('pushPullButton.forcePushTitle', { remoteName }),
          description: (
            <>
              {t('pushPullButton.forcePushDescriptionPrefix', { remoteName })}
              {forcePushWarning}
            </>
          ),
          action: this.props.forcePushWithLease,
          icon: forcePushIcon,
        }
      }
    }
  }

  public renderDropdownItem = (type: DropdownItemType) => {
    const item = this.getDropdownItemWithType(type)
    return (
      <Button
        className={DropdownItemClassName}
        key={type}
        onClick={item.action}
      >
        <Octicon symbol={item.icon} />
        <div className="text-container">
          <div className="title">{item.title}</div>
          <div className="detail">{item.description}</div>
        </div>
      </Button>
    )
  }

  public render() {
    const { itemTypes } = this.props
    return (
      <div className="push-pull-dropdown" ref={this.onButtonsContainerRef}>
        {itemTypes.map(this.renderDropdownItem)}
      </div>
    )
  }
}

export const PushPullButtonDropDown = withTranslation()(
  PushPullButtonDropDownImpl
) as any
