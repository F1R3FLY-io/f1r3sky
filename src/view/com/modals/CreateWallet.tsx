import {useCallback} from 'react'
import {SafeAreaView, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {usePalette} from '#/lib/hooks/usePalette'
import {NavigationProp} from '#/lib/routes/types'
import {generateKeyAndAddress, saveWalletToFS} from '#/lib/wallet'
import {useModalControls} from '#/state/modals'
import {useWallets} from '#/state/wallets'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {Button} from '../util/forms/Button'
import {ScrollView} from './util'

export const snapPoints = ['90%']

export type Props = {}

export function Component({}: Props) {
  const t = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const {closeModal} = useModalControls()
  const {wallets, addWallet} = useWallets()

  const navigation = useNavigation<NavigationProp>()
  const createWallet = useCallback(async () => {
    const wallet = generateKeyAndAddress()
    const saveRes = await saveWalletToFS(wallet)

    if (!saveRes) {
      Toast.show(_(msg`File saved successfully!`))
    } else {
      Toast.show(_(msg`Failed to save file!`))
    }

    addWallet(wallet)
    navigation.navigate('Wallet', {position: wallets.length + 1})
  }, [_, addWallet, navigation, wallets.length])

  return (
    <SafeAreaView style={[pal.view, a.flex_1]}>
      <ScrollView>
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
              type="primary"
              onPress={() => {
                createWallet().then(() => closeModal())
              }}
              withLoading
              accessibilityLabel={_(msg`Download key and open wallet`)}
              accessibilityHint={_(msg`Click to download key and open wallet`)}
              label={_(msg`Download key & Open wallet`)}
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
