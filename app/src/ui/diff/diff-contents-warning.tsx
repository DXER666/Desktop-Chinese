import React from 'react'
import { withTranslation, WithTranslation, Trans } from 'react-i18next'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { LinkButton } from '../lib/link-button'
import { ITextDiff, LineEndingsChange } from '../../models/diff'

enum DiffContentsWarningType {
  UnicodeBidiCharacters,
  LineEndingsChange,
}

type DiffContentsWarningItem =
  | {
      readonly type: DiffContentsWarningType.UnicodeBidiCharacters
    }
  | {
      readonly type: DiffContentsWarningType.LineEndingsChange
      readonly lineEndingsChange: LineEndingsChange
    }

interface IDiffContentsWarningProps {
  readonly diff: ITextDiff
}

class DiffContentsWarningInternal extends React.Component<
  IDiffContentsWarningProps & WithTranslation
> {
  public render() {
    const items = this.getTextDiffWarningItems()

    if (items.length === 0) {
      return null
    }

    return (
      <div className="diff-contents-warning-container">
        {items.map((item, i) => (
          <div className="diff-contents-warning" key={i}>
            <Octicon symbol={octicons.alert} />
            {this.getWarningMessageForItem(item)}
          </div>
        ))}
      </div>
    )
  }

  private getTextDiffWarningItems(): ReadonlyArray<DiffContentsWarningItem> {
    const items = new Array<DiffContentsWarningItem>()
    const { diff } = this.props

    if (diff.hasHiddenBidiChars) {
      items.push({
        type: DiffContentsWarningType.UnicodeBidiCharacters,
      })
    }

    if (diff.lineEndingsChange) {
      items.push({
        type: DiffContentsWarningType.LineEndingsChange,
        lineEndingsChange: diff.lineEndingsChange,
      })
    }

    return items
  }

  private getWarningMessageForItem(item: DiffContentsWarningItem) {
    const { t } = this.props
    switch (item.type) {
      case DiffContentsWarningType.UnicodeBidiCharacters:
        return (
          <>
            {t(
              'diffContentsWarning.unicodeBidiTitle',
              'This diff contains bidirectional Unicode text that may be interpreted or compiled differently than what appears below. To review, open the file in an editor that reveals hidden Unicode characters.'
            )}{' '}
            <LinkButton uri="https://github.co/hiddenchars">
              {t(
                'diffContentsWarning.unicodeBidiLearnMore',
                'Learn more about bidirectional Unicode characters'
              )}
            </LinkButton>
          </>
        )

      case DiffContentsWarningType.LineEndingsChange:
        const { lineEndingsChange } = item
        const trans = (
          <Trans
            i18nKey="diffContentsWarning.lineEndingsMessage"
            defaults="This file uses '{{from}}' line endings, but <0>Git is configured to convert them</0> to '{{to}}' the next time the file is checked out."
            values={{
              from: lineEndingsChange.from,
              to: lineEndingsChange.to,
            }}
            components={[
              <LinkButton
                key="link"
                uri="https://docs.github.com/get-started/git-basics/configuring-git-to-handle-line-endings"
              />,
            ]}
          />
        )
        if (typeof (trans as any).type !== 'undefined') {
          return trans
        }
        // Fallback in case Trans returns something not renderable (very
        // unlikely) — we also build a plain-text version without link
        return (
          <>
            {t(
              'diffContentsWarning.lineEndingsMessageFallback',
              "This file uses '{{from}}' line endings, but Git is configured to convert them to '{{to}}' the next time the file is checked out.",
              {
                from: lineEndingsChange.from,
                to: lineEndingsChange.to,
              }
            )}{' '}
            <LinkButton uri="https://docs.github.com/get-started/git-basics/configuring-git-to-handle-line-endings">
              {t(
                'lineEndings.learnMoreLinkText',
                'Configuring Git to handle line endings'
              )}
            </LinkButton>
          </>
        )
    }
  }
}

export const DiffContentsWarning = withTranslation()(
  DiffContentsWarningInternal
) as unknown as React.ComponentClass<IDiffContentsWarningProps>
