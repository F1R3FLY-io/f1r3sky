import {useCallback} from 'react'
import {View} from 'react-native'
import {Address, PrivateKey} from '@f1r3fly-io/embers-client-sdk'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {saveWalletToFS} from '#/lib/wallet'
import {useWallets, WalletType} from '#/state/wallets'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {Button} from './Button'

export function CreateWallet() {
  const t = useTheme()
  const {_} = useLingui()
  const control = Dialog.useDialogContext()
  const {addWallet} = useWallets()

  const navigation = useNavigation<NavigationProp>()
  const createWallet = useCallback(async () => {
    const privateKey = PrivateKey.new()
    const publicKey = privateKey.getPublicKey()
    const address = Address.fromPublicKey(publicKey)
    const wallet = {
      privateKey,
      address,
      publicKey,
      walletType: WalletType.F1R3CAP as const,
    }

    const saveRes = await saveWalletToFS(wallet)

    if (saveRes) {
      Toast.show(_(msg`File saved successfully!`), {type: 'success'})
    } else {
      Toast.show(_(msg`Failed to save file!`), {type: 'error'})
    }

    const position = addWallet(wallet)
    navigation.navigate('Wallet', {position})
  }, [_, addWallet, navigation])

  return (
    <Dialog.ScrollableInner label={_(msg`Add wallet dialog`)}>
      <View style={[a.flex_col, a.justify_center, a.align_center, a.gap_lg]}>
        <Text style={[a.text_xl, a.font_bold]}>
          <Trans>Create wallet</Trans>
        </Text>
        <View>
          <Text
            style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
            <Trans>
              To create your wallet, we need to generate a private key.
            </Trans>
          </Text>
          <Text
            style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
            <Trans>
              This key will give you full access to your wallet — make sure to
              save it securely.
            </Trans>
          </Text>
        </View>
        <View style={[a.gap_sm, a.self_stretch]}>
          <Button
            color="primary"
            size="large"
            onPress={() => createWallet().then(() => control.close())}
            label={_(msg`Download key & Open wallet`)}>
            <Text style={[a.text_sm, a.font_bold]}>
              <Trans>Download key & Open wallet</Trans>
            </Text>
          </Button>
          <Button
            color="secondary"
            size="large"
            onPress={() => control.close()}
            label={_(msg`Cancel`)}>
            <Text style={[a.text_sm, a.font_bold]}>
              <Trans>Cancel</Trans>
            </Text>
          </Button>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
