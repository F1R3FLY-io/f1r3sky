import {SafeAreaView, View} from 'react-native'
import {Trans} from '@lingui/macro'

import {usePalette} from '#/lib/hooks/usePalette'
import {useModalControls} from '#/state/modals'
import {PressableWithHover} from '#/view/com/util/PressableWithHover'
import {atoms as a, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Wallet} from '#/components/icons/Wallet'
import {Text} from '#/components/Typography'
import {WalletAddress} from '#/components/WalletAddress'
import {ScrollView} from './util'

export const snapPoints = ['40%']

export type Props = {
  walletAddress: string
  onRemoveWallet: () => void
}

export function Component({walletAddress, onRemoveWallet}: Props) {
  const t = useTheme()
  const pal = usePalette('default')
  const {closeModal} = useModalControls()

  const handleRemove = () => {
    onRemoveWallet()
    closeModal()
  }

  return (
    <SafeAreaView style={[pal.view, a.flex_1]}>
      <ScrollView>
        <View style={[a.flex_col, a.gap_md, a.p_lg]}>
          <Text style={[a.text_xl, a.font_bold, a.text_center]}>
            <Trans>Linked Wallet</Trans>
          </Text>
          <Text
            style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
            <Trans>This wallet is linked to your post for tips</Trans>
          </Text>

          <View style={[a.py_lg]}>
            <Divider />
          </View>

          <View style={[a.gap_xs]}>
            <PressableWithHover
              hoverStyle={t.atoms.bg_contrast_25}
              onPress={handleRemove}>
              <View
                style={[
                  a.flex_row,
                  a.align_center,
                  a.justify_between,
                  a.p_lg,
                  a.gap_md,
                ]}>
                <View style={[a.flex_row, a.align_center, a.gap_sm, a.flex_1]}>
                  <Wallet />
                  <Text style={[a.text_md]} numberOfLines={1}>
                    <Trans>Wallet</Trans> #
                    <WalletAddress value={walletAddress} />
                  </Text>
                </View>
                <X size="md" style={t.atoms.text_contrast_medium} />
              </View>
            </PressableWithHover>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
