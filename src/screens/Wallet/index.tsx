import {useCallback, useState} from 'react'
import {TouchableOpacity, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModalControls} from '#/state/modals'
import {useWalletState} from '#/state/queries/wallet'
import {useSession} from '#/state/session'
import {Button} from '#/view/com/util/forms/Button'
import {atoms as a, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {Copy, Hide, Show, WalletTranscation} from '#/components/icons/Wallet'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import TransactionHistory from './TransactionHistory'
import WalletBalanceGraph from './WalletBalanceGraph'

export default function Wallet({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'Wallet'
>) {
  const t = useTheme()
  const {_} = useLingui()
  const {openModal} = useModalControls()

  const {currentAccount} = useSession()
  const {data: walletState, isLoading} = useWalletState()

  const [showAddress, setShowAddres] = useState(false)
  const flipShowAddress = useCallback(
    () => setShowAddres(state => !state),
    [setShowAddres],
  )

  const shareAddress = useCallback(() => {
    if (walletState?.address) {
      shareUrl(walletState.address)
    }
  }, [walletState?.address])

  let walletAddresLine: JSX.Element
  if (isLoading) {
    walletAddresLine = (
      <Text numberOfLines={1} style={[a.text_sm, a.py_2xs]}>
        <Trans>Loading...</Trans>
      </Text>
    )
  } else {
    walletAddresLine = (
      <>
        <Text numberOfLines={1} style={[a.text_sm, a.py_2xs]}>
          {showAddress ? walletState!.address : '********'}
        </Text>
        <TouchableOpacity onPress={flipShowAddress} accessibilityRole="button">
          {showAddress ? <Hide /> : <Show />}
        </TouchableOpacity>
        <TouchableOpacity onPress={shareAddress} accessibilityRole="button">
          <Copy />
        </TouchableOpacity>
      </>
    )
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Wallet</Trans>
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
            <View style={[a.gap_md, a.flex_col]}>
              <Text
                style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
                <Trans>Account ID</Trans>
              </Text>
              <Text
                style={[
                  a.text_sm,
                  a.font_bold,
                  a.py_2xs,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>Wallet address</Trans>
              </Text>
              <Text
                style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
                <Trans>Default token</Trans>
              </Text>
            </View>
            <View style={[a.flex_col, a.flex_shrink, a.gap_md]}>
              <Text
                style={[
                  a.text_sm,
                  a.font_heavy_bold,
                  t.atoms.text_contrast_medium,
                ]}>
                @{sanitizeHandle(currentAccount?.handle)}
              </Text>
              <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                {walletAddresLine}
              </View>
              <Text style={[a.text_sm]}>F1R3CAP</Text>
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
                    walletState!.balance.toString()
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
              <Button
                type="primary"
                onPress={() => {
                  if (isLoading) {
                    return
                  }

                  openModal({
                    name: 'wallet-transfer',
                    currentBalance: walletState!.balance,
                    userAddress: walletState!.address,
                  })
                }}
                accessibilityLabel={_(msg`Transfer tokens`)}
                accessibilityHint=""
                label={_(msg`Transfer tokens`)}
                labelContainerStyle={[a.justify_center, a.p_xs]}
                labelStyle={[a.text_lg]}
              />
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
