import {TouchableOpacity, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {RouteProp, useRoute} from '@react-navigation/native'
import {useNavigation} from '@react-navigation/native'
import {base16} from '@scure/base'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {NavigationProp} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {saveWalletToFS} from '#/lib/wallet'
import {useModalControls} from '#/state/modals'
import {useWalletState} from '#/state/queries/wallet'
import {useWallets} from '#/state/wallets'
import {Button} from '#/view/com/util/forms/Button'
import {atoms as a, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {Download_Stroke2_Corner0_Rounded as DownloadIcon} from '#/components/icons/Download'
import {Copy, Transfer, WalletTranscation} from '#/components/icons/Wallet'
import * as Layout from '#/components/Layout'
import {ToggleShow} from '#/components/ToggleText'
import {Text} from '#/components/Typography'
import TransactionHistory from './TransactionHistory'
import WalletBalanceGraph from './WalletBalanceGraph'

export default function Wallet({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'Wallet'
>) {
  const t = useTheme()
  const {_} = useLingui()

  const {params} = useRoute<RouteProp<CommonNavigatorParams, 'Wallet'>>()
  const {wallets} = useWallets()
  const wallet = wallets.at(+params.position - 1)

  const {data: walletState, isLoading} = useWalletState(wallet?.address)

  const {openModal} = useModalControls()
  const navigation = useNavigation<NavigationProp>()

  if (wallet === undefined) {
    navigation.navigate('Wallets')
    return null
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Wallet #{wallet?.hash}</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>
      <Layout.Content>
        <View style={[a.p_3xl, a.gap_lg]}>
          <Text style={[a.text_md, a.font_bold]}>
            <Trans>Account</Trans>
          </Text>
          <View
            style={[
              a.p_2xl,
              a.flex_row,
              a.gap_2xl,
              a.rounded_md,
              t.atoms.bg_contrast_25,
            ]}>
            <View style={[a.flex_col, a.gap_md, a.justify_between]}>
              <Text
                style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
                <Trans>Wallet address</Trans>
              </Text>
              <Text
                style={[
                  a.text_sm,
                  a.font_bold,
                  a.py_2xs,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>Private key</Trans>
              </Text>
              <Text
                style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
                <Trans>Default token</Trans>
              </Text>
            </View>
            <View style={[a.flex_col, a.gap_md, a.justify_between, a.flex_1]}>
              <View>
                <ToggleShow
                  text={wallet.address}
                  textStyle={[a.text_sm]}
                  numberOfLines={1}>
                  <TouchableOpacity
                    onPress={() => shareUrl(wallet.address)}
                    accessibilityRole="button">
                    <Copy />
                  </TouchableOpacity>
                </ToggleShow>
              </View>
              <ToggleShow
                text={base16.encode(wallet.key)}
                textStyle={[a.text_sm]}
                numberOfLines={1}>
                <TouchableOpacity
                  onPress={() => saveWalletToFS(wallet)}
                  accessibilityRole="button">
                  <DownloadIcon />
                </TouchableOpacity>
              </ToggleShow>
              <Text style={[a.text_sm]}>
                <Trans>F1R3CAP</Trans>
              </Text>
            </View>
          </View>
        </View>
        <Divider />
        <View style={[a.p_3xl, a.gap_lg]}>
          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            <WalletTranscation />
            <Layout.Header.TitleText>
              <Trans>Balance</Trans>
            </Layout.Header.TitleText>
          </View>
          <View style={[a.rounded_md, t.atoms.bg_contrast_25]}>
            <View style={[a.p_2xl]}>
              <View style={[a.flex_row, a.align_end, a.gap_sm]}>
                <Layout.Header.TitleText>
                  {isLoading ? (
                    <Trans>Loading...</Trans>
                  ) : (
                    walletState?.balance?.toString() ?? ''
                  )}
                </Layout.Header.TitleText>
                <Text style={[a.text_xs, a.pb_xs]}>F1R3CAP</Text>
              </View>
              <WalletBalanceGraph
                balance={walletState?.balance ?? 0n}
                requests={walletState?.requests ?? []}
                boosts={walletState?.boosts ?? []}
                transfers={walletState?.transfers ?? []}
              />
              <View style={[a.self_start, a.pt_xl]}>
                <Button
                  type="transparent-outline"
                  style={[{borderRadius: 6}]}
                  onPress={() => {
                    if (isLoading) {
                      return
                    }

                    openModal({
                      name: 'wallet-transfer',
                      currentBalance: walletState!.balance,
                      wallet,
                    })
                  }}
                  accessibilityLabel={_(msg`Transfer`)}
                  accessibilityHint="">
                  <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                    <Transfer />
                    <Text style={[a.text_sm, a.font_bold]}>
                      <Trans>Transfer</Trans>
                    </Text>
                  </View>
                </Button>
              </View>
            </View>
          </View>
        </View>
        <Divider />
        <View style={[a.p_3xl, a.gap_lg]}>
          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            <WalletTranscation />
            <Layout.Header.TitleText>
              <Trans>Transactions history</Trans>
            </Layout.Header.TitleText>
          </View>
        </View>
        <TransactionHistory
          requests={walletState?.requests ?? []}
          boosts={walletState?.boosts ?? []}
          transfers={walletState?.transfers ?? []}
        />
      </Layout.Content>
    </Layout.Screen>
  )
}
