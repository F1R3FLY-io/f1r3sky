import {useCallback} from 'react'
import {SafeAreaView, View} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {base64} from '@scure/base'
import {type Hex} from 'viem'
import {privateKeyToAccount} from 'viem/accounts'

import {usePalette} from '#/lib/hooks/usePalette'
import {downloadDocument} from '#/lib/media/manip'
import {type NavigationProp} from '#/lib/routes/types'
import {getAddressFromPublicKey, getPublicKeyFromPrivateKey} from '#/lib/wallet'
import {useModalControls} from '#/state/modals'
import {
  type EtheriumWallet,
  type FireCAPWallet,
  useWallets,
  type WalletKey,
  WalletType,
} from '#/state/wallets'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {Button} from '../util/forms/Button'
import {ScrollView} from './util'

export const snapPoints = ['90%']

export function Component() {
  const t = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const {closeModal} = useModalControls()
  const {addWallet} = useWallets()

  const navigation = useNavigation<NavigationProp>()
  const pickWalletKey = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/x-pem-file',
      copyToCacheDirectory: true,
      multiple: false,
    })

    if (result.canceled) {
      return
    }

    await downloadDocument(result.assets[0])
      .then(content => {
        const isFireCAPKey = content.includes('BEGIN EC PRIVATE KEY')
        if (isFireCAPKey) {
          const encodedKey = content
            .replace('-----BEGIN EC PRIVATE KEY-----', '')
            .replace('-----END EC PRIVATE KEY-----', '')
            .trim()

          const privateKey = base64.decode(encodedKey) as Uint8Array
          const publicKey = getPublicKeyFromPrivateKey(privateKey)
          const address = getAddressFromPublicKey(publicKey)

          return {
            privateKey,
            publicKey,
            address,
            walletType: WalletType.F1R3CAP,
          } as FireCAPWallet
        } else {
          const prvKey = content as Hex
          const client = privateKeyToAccount(prvKey)

          return {
            privateKey: content as WalletKey,
            publicKey: client.publicKey,
            address: client.address,
            walletType: WalletType.ETHERIUM,
          } as EtheriumWallet
        }
      })
      .then(wallet => {
        let position = addWallet(wallet) || 0
        console.log(position)
        Toast.show(_(msg`Walled added successfully!`))
        navigation.navigate('Wallet', {position})
      })
      .catch(() => {
        Toast.show(_(msg`Failed to load file with wallet's private key!`))
        return
      })
  }, [_, addWallet, navigation])

  return (
    <SafeAreaView style={[pal.view, a.flex_1]}>
      <ScrollView>
        <View style={[a.flex_col, a.justify_center, a.align_center, a.gap_lg]}>
          <Text style={[a.text_xl, a.font_bold]}>
            <Trans>Add wallet</Trans>
          </Text>
          <Text
            style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
            <Trans>Select private key from your device.</Trans>
          </Text>
          <View style={[a.gap_sm, a.self_stretch]}>
            <Button
              type="primary"
              onPress={() => {
                pickWalletKey().then(() => closeModal())
              }}
              withLoading
              accessibilityLabel={_(msg`Open file selection screen`)}
              accessibilityHint={_(msg`Click to open file selection screen`)}
              label={_(msg`Select key`)}
              labelContainerStyle={[a.justify_center, a.p_xs]}
              labelStyle={[a.text_lg]}
            />
            <Button
              type="default"
              onPress={() => {
                closeModal()
              }}
              accessibilityLabel={_(msg`Cancel`)}
              accessibilityHint={_(msg`Click to cancel`)}
              label={_(msg`Cancel`)}
              labelContainerStyle={[a.justify_center, a.p_xs]}
              labelStyle={[a.text_lg]}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
