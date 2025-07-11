import {View} from 'react-native'
import {Trans} from '@lingui/macro'
import {useNavigation} from '@react-navigation/native'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {type NavigationProp} from '#/lib/routes/types'
import {useModalControls} from '#/state/modals'
import {useWallets} from '#/state/wallets'
import {PressableWithHover} from '#/view/com/util/PressableWithHover'
import {atoms as a, useTheme} from '#/alf'
import {AddWallet, Wallet} from '#/components/icons/Wallet'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {WalletAddress} from '#/components/WalletAddress'

export function Wallets({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'Wallets'
>) {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const {openModal} = useModalControls()

  const onPressItem = (position: number) =>
    navigation.push('Wallet', {position: position + 1})

  const {getAll} = useWallets()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Wallets</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>
      <Layout.Content>
        {getAll().map((wallet, i) => (
          <PressableWithHover
            key={i}
            hoverStyle={t.atoms.bg_contrast_25}
            onPress={() => onPressItem(i)}>
            <View style={[a.flex_row, a.align_center, a.p_2xl, a.gap_sm]}>
              <Wallet />
              <Text style={[a.text_md]}>
                <Trans>Wallet</Trans> #
                <WalletAddress value={wallet.address} />
              </Text>
            </View>
          </PressableWithHover>
        ))}
        <PressableWithHover
          hoverStyle={t.atoms.bg_contrast_25}
          onPress={() => openModal({name: 'create-wallet'})}>
          <View style={[a.flex_row, a.align_center, a.p_2xl, a.gap_sm]}>
            <AddWallet />
            <Text style={[a.text_md]}>
              <Trans>Create new wallet</Trans>
            </Text>
          </View>
        </PressableWithHover>
        <PressableWithHover
          hoverStyle={t.atoms.bg_contrast_25}
          onPress={() => openModal({name: 'add-wallet'})}>
          <View style={[a.flex_row, a.align_center, a.p_2xl, a.gap_sm]}>
            <AddWallet />
            <Text style={[a.text_md]}>
              <Trans>Add wallet</Trans>
            </Text>
          </View>
        </PressableWithHover>
      </Layout.Content>
    </Layout.Screen>
  )
}
