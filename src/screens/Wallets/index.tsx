import {View} from 'react-native'
import {Trans} from '@lingui/macro'
import {useNavigation} from '@react-navigation/native'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {type NavigationProp} from '#/lib/routes/types'
import {useWallets} from '#/state/wallets'
import {PressableWithHover} from '#/view/com/util/PressableWithHover'
import {atoms as a, useTheme} from '#/alf'
import {AddWallet} from '#/components/AddWallet'
import {CreateWallet} from '#/components/CreateWallet'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {AddWallet as AddWalletIcon, Wallet} from '#/components/icons/Wallet'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {WalletAddress} from '#/components/WalletAddress'

export function Wallets({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'Wallets'
>) {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const addWalletControl = Dialog.useDialogControl()
  const createWalletControl = Dialog.useDialogControl()

  const onPressItem = (position: number) =>
    navigation.push('Wallet', {position: position + 1})

  const {wallets} = useWallets()

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
        {wallets.map((wallet, i) => (
          <PressableWithHover
            key={wallet.address.value + i}
            hoverStyle={t.atoms.bg_contrast_25}
            onPress={() => onPressItem(i)}>
            <View style={[a.flex_row, a.align_center, a.p_2xl, a.gap_sm]}>
              <Wallet />
              <Text style={[a.text_md]}>
                <Trans>Wallet</Trans> #
                <WalletAddress value={wallet.address.value} />
              </Text>
            </View>
          </PressableWithHover>
        ))}
        <Divider />
        <PressableWithHover
          hoverStyle={t.atoms.bg_contrast_25}
          onPress={createWalletControl.open}>
          <View style={[a.flex_row, a.align_center, a.p_2xl, a.gap_sm]}>
            <AddWalletIcon />
            <Text style={[a.text_md]}>
              <Trans>Create new wallet</Trans>
            </Text>
          </View>
        </PressableWithHover>
        <PressableWithHover
          hoverStyle={t.atoms.bg_contrast_25}
          onPress={addWalletControl.open}>
          <View style={[a.flex_row, a.align_center, a.p_2xl, a.gap_sm]}>
            <AddWalletIcon />
            <Text style={[a.text_md]}>
              <Trans>Add wallet</Trans>
            </Text>
          </View>
        </PressableWithHover>
        <Dialog.Outer
          control={addWalletControl}
          nativeOptions={{preventExpansion: true}}>
          <Dialog.Handle />
          <AddWallet />
        </Dialog.Outer>
        <Dialog.Outer
          control={createWalletControl}
          nativeOptions={{preventExpansion: true}}>
          <Dialog.Handle />
          <CreateWallet />
        </Dialog.Outer>
      </Layout.Content>
    </Layout.Screen>
  )
}
