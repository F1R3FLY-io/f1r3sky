import {useCallback} from 'react'
import {View} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import {Address, deserializeKey} from '@f1r3fly-io/embers-client-sdk'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {downloadDocument} from '#/lib/media/manip'
import {type NavigationProp} from '#/lib/routes/types'
import {useWallets, WalletType} from '#/state/wallets'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {Button} from './Button'

export function AddWallet() {
  const t = useTheme()
  const {_} = useLingui()
  const control = Dialog.useDialogContext()
  const {addWallet} = useWallets()

  const navigation = useNavigation<NavigationProp>()
  const pickWalletKey = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
      multiple: false,
    })

    if (result.canceled) {
      return
    }

    await downloadDocument(result.assets[0])
      .then(content => {
        const privateKey = deserializeKey(content)
        const publicKey = privateKey.getPublicKey()
        const address = Address.fromPublicKey(publicKey)

        return {
          privateKey,
          publicKey,
          address,
          walletType: WalletType.F1R3CAP as const,
        }
      })
      .then(wallet => {
        let position = addWallet(wallet)
        Toast.show(_(msg`Walled added successfully!`), {
          type: 'success',
        })
        navigation.navigate('Wallet', {position})
      })
      .catch(() => {
        Toast.show(_(msg`Failed to load file with wallet's private key!`), {
          type: 'error',
        })
      })
  }, [_, addWallet, navigation])

  return (
    <Dialog.ScrollableInner label={_(msg`Add wallet dialog`)}>
      <View style={[a.flex_col, a.justify_center, a.align_center, a.gap_lg]}>
        <Text style={[a.text_xl, a.font_bold]}>
          <Trans>Add wallet</Trans>
        </Text>
        <Text style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
          <Trans>Select private key from your device.</Trans>
        </Text>
        <View style={[a.gap_sm, a.self_stretch]}>
          <Button
            color="primary"
            size="large"
            onPress={() => pickWalletKey().then(() => control.close())}
            label={_(msg`Select key`)}>
            <Text style={[a.text_sm, a.font_bold]}>
              <Trans>Select key</Trans>
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
