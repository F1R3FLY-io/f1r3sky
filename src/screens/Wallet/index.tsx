import {useCallback, useMemo, useState} from 'react'
import {TouchableOpacity, View} from 'react-native'
import {Trans} from '@lingui/macro'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {Copy, Hide, Show, WalletTranscation} from '#/components/icons/Wallet'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import TransactionHistory from './TransactionHistory'
import useWalletState from './useWalletState'
import WalletBalanceGraph from './WalletBalanceGraph'

export default function Wallet({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'Wallet'
>) {
  const t = useTheme()
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const {data: walletStateOld, isLoading} = useWalletState()

  const [showAddress, setShowAddres] = useState(false)
  const flipShowAddress = useCallback(
    () => setShowAddres(state => !state),
    [setShowAddres],
  )

  const walletState: typeof walletStateOld = useMemo(
    () =>
      walletStateOld && {
        address: walletStateOld.address || 'dummy_address',
        balance: walletStateOld.balance || 31.128,
        requests:
          walletStateOld.requests.length !== 0
            ? walletStateOld.requests
            : [
                {
                  id: 'deade3123f',
                  date: new Date(2025, 3, 2, 12, 0, 0),
                  amount: 12,
                  status: 'ongoing',
                },
                {
                  id: 'darggxc45',
                  date: new Date(2025, 2, 12, 12, 0, 0),
                  amount: 37,
                  status: 'done',
                },
                {
                  id: 'j634gf5',
                  date: new Date(2025, 2, 20, 12, 0, 0),
                  amount: 13,
                  status: 'cancelled',
                },
                {
                  id: 'deade3123f',
                  date: new Date(2025, 3, 2, 12, 0, 0),
                  amount: 12,
                  status: 'ongoing',
                },
                {
                  id: 'darggxc45',
                  date: new Date(2025, 2, 12, 12, 0, 0),
                  amount: 37,
                  status: 'done',
                },
                {
                  id: 'j634gf5',
                  date: new Date(2025, 2, 20, 12, 0, 0),
                  amount: 13,
                  status: 'cancelled',
                },
                {
                  id: 'deade3123f',
                  date: new Date(2025, 3, 2, 12, 0, 0),
                  amount: 12,
                  status: 'ongoing',
                },
                {
                  id: 'darggxc45',
                  date: new Date(2025, 2, 12, 12, 0, 0),
                  amount: 37,
                  status: 'done',
                },
                {
                  id: 'j634gf5',
                  date: new Date(2025, 2, 20, 12, 0, 0),
                  amount: 13,
                  status: 'cancelled',
                },
                {
                  id: 'deade3123f',
                  date: new Date(2025, 3, 2, 12, 0, 0),
                  amount: 12,
                  status: 'ongoing',
                },
                {
                  id: 'darggxc45',
                  date: new Date(2025, 2, 12, 12, 0, 0),
                  amount: 37,
                  status: 'done',
                },
                {
                  id: 'j634gf5',
                  date: new Date(2025, 2, 20, 12, 0, 0),
                  amount: 13,
                  status: 'cancelled',
                },
              ],
        boosts:
          walletStateOld.boosts.length !== 0
            ? walletStateOld.boosts
            : [
                {
                  id: 'deade3123f',
                  direction: 'outgoing',
                  date: new Date(2025, 1, 12, 14, 0, 0),
                  amount: 33,
                  username: 'foo.test',
                  post: '3lmeun6nxfc27',
                },
                {
                  id: 'darggxc45',
                  direction: 'incoming',
                  date: new Date(2025, 1, 20, 11, 0, 0),
                  amount: 12,
                  username: 'SomeUser33',
                  post: '1234412',
                },
              ],
        transfers:
          walletStateOld.transfers.length !== 0
            ? walletStateOld.transfers
            : [
                {
                  id: 'j634gf5',
                  direction: 'incoming',
                  date: new Date(2025, 2, 6, 12, 0, 0),
                  amount: 40,
                  to_address: '1DkyAJL8Kt8O67GJNKJbdd9083Qh26jklQepA',
                },
                {
                  id: 'darggxc45',
                  direction: 'outgoing',
                  date: new Date(2025, 2, 12, 12, 0, 0),
                  amount: 7,
                  to_address: '1DkyAJL8Kt8O67GJNKJbdd9083Qh26jklQepA',
                },
              ],
      },
    [walletStateOld],
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
    <Layout.Screen testID="listsScreen">
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
                @{sanitizeHandle(profile?.handle)}
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
                  {isLoading ? <Trans>Loading...</Trans> : walletState!.balance}
                </Layout.Header.TitleText>
                <Text style={[a.text_xs, a.pb_xs]}>F1R3CAP</Text>
              </View>
              <WalletBalanceGraph
                balance={walletState?.balance ?? 0}
                requests={walletState?.requests ?? []}
                boosts={walletState?.boosts ?? []}
                transfers={walletState?.transfers ?? []}
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
