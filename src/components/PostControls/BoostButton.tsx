import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useUserBoostQuery} from '#/state/queries/wallet'
import {useWallets} from '#/state/wallets'
import * as Dialog from '#/components/Dialog'
import {WalletBoost} from '#/components/dialogs/WalletBoost'
import {BoostIcon} from '#/components/icons/Wallet'
import {PostControlButton, PostControlButtonIcon} from './PostControlButton'

type BoostButtonProps = {
  did: string
  handle: string
  big?: boolean
}

export function BoostButton({big, did, handle}: BoostButtonProps) {
  const {_} = useLingui()

  const dialogControl = Dialog.useDialogControl()
  const wallets = useWallets()
  const {data: boost} = useUserBoostQuery(did)

  if (wallets.wallets.length === 0 || boost === undefined) {
    return null
  }

  return (
    <>
      <PostControlButton
        big={big}
        onPress={dialogControl.open}
        label={_(msg`Boost author`)}>
        <PostControlButtonIcon icon={BoostIcon} />
      </PostControlButton>
      <Dialog.Outer
        control={dialogControl}
        nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <WalletBoost
          destination={boost.walletAddress}
          message={boost.message}
          handle={handle}
          wallets={wallets.wallets}
        />
      </Dialog.Outer>
    </>
  )
}
