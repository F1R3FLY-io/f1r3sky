import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useUserBoostQuery} from '#/state/queries/wallet'
import {useWallets} from '#/state/wallets'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {WalletBoost} from '#/components/dialogs/WalletBoost'
import {BoostIcon} from '#/components/icons/Wallet'

type BoostProfileButtonProps = {
  handle: string
  did: string
}

export function BoostProfileButton({handle, did}: BoostProfileButtonProps) {
  const {_} = useLingui()

  const dialogControl = Dialog.useDialogControl()
  const wallets = useWallets()

  const {data: boost} = useUserBoostQuery(did)

  if (wallets.wallets.length === 0 || boost === undefined) {
    return null
  }

  return (
    <>
      <Button
        size="small"
        color="primary"
        label={_(msg`Boost user`)}
        onPress={dialogControl.open}
        style={[a.rounded_full]}>
        <ButtonIcon icon={BoostIcon} />
        <ButtonText>
          <Trans>Boost</Trans>
        </ButtonText>
      </Button>
      <Dialog.Outer
        control={dialogControl}
        nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <WalletBoost
          destination={boost.walletAddress}
          message={boost.message}
          handle={handle}
          wallets={wallets.wallets}
          postAuthorDid={did}
        />
      </Dialog.Outer>
    </>
  )
}
