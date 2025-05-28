import {useCallback} from 'react'
import {SafeAreaView, View} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {usePalette} from '#/lib/hooks/usePalette'
import {downloadDocument} from '#/lib/media/manip'
import {NavigationProp} from '#/lib/routes/types'
import {parseWallet} from '#/lib/wallet'
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
  const pickWalletKey = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
      multiple: false,
    })

    if (result.canceled) {
      return
    }

    const content = await downloadDocument(result.assets[0])
    const wallet = parseWallet(content)

    if (wallet === undefined) {
      Toast.show(_(msg`Failed to load file!`))
      return
    }

    addWallet(wallet)
    Toast.show(_(msg`Walled added successfully!`))
    navigation.navigate('Wallet', {position: wallets.length + 1})
  }, [_, addWallet, navigation, wallets.length])

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
