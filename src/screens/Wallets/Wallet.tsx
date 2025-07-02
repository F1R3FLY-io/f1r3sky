import {useEffect, useState} from 'react'
import {ScrollView, TouchableOpacity, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type RouteProp} from '@react-navigation/native'
import {useRoute} from '@react-navigation/native'
import {useNavigation} from '@react-navigation/native'
import {createPublicClient, type Hex, http} from 'viem'
import {privateKeyToAccount} from 'viem/accounts'
import {mainnet} from 'viem/chains'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {type NavigationProp} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {
  fetchEtheriumWalletState,
  fetchF1r3SkyWalletState,
  getAddressFromPublicKey,
  getPublicKeyFromPrivateKey,
  saveWalletToFS,
} from '#/lib/wallet'
import {useModalControls} from '#/state/modals'
import {WalletState} from '#/state/queries/wallet'
import {useAgent} from '#/state/session'
import {useWallets, WalletType} from '#/state/wallets'
import {Button} from '#/view/com/util/forms/Button'
import {atoms as a, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {Download_Stroke2_Corner0_Rounded as DownloadIcon} from '#/components/icons/Download'
import {Copy, Transfer, WalletTranscation} from '#/components/icons/Wallet'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {WalletAddress} from '#/components/WalletAddress'
import TransactionHistory from './TransactionHistory'
import WalletBalanceGraph from './WalletBalanceGraph'

enum SCREEN_STATE {
  LOADING,
  LOADED,
  ABSENT,
  ERROR,
}

export default function Component({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'Wallet'
>) {
  const t = useTheme()
  const {_} = useLingui()
  const agent = useAgent()
  const {openModal} = useModalControls()
  const {getByIndex} = useWallets()
  const navigation = useNavigation<NavigationProp>()
  const {params} = useRoute<RouteProp<CommonNavigatorParams, 'Wallet'>>()

  const [walletState, setWalletState] = useState<WalletState | undefined>()
  const [screenState, changeScreenState] = useState<SCREEN_STATE>(
    SCREEN_STATE.LOADING,
  )

  useEffect(() => {
    const wallet = getByIndex(+params.position - 1)

    if (wallet) {
      switch (wallet?.tag) {
        case WalletType.F1R3CAP:
          fetchF1r3SkyWalletState(agent, wallet, data => {
            const state = WalletState.parse(data)
            setWalletState({wallet, ...state})
          })
          changeScreenState(SCREEN_STATE.LOADED)
          break
        case WalletType.ETHERIUM:
          fetchEtheriumWalletState(wallet, async etherWallet => {
            const account = privateKeyToAccount(etherWallet.privateKey as Hex)

            const publicClient = createPublicClient({
              chain: mainnet,
              transport: http(),
            })

            const balance = await publicClient.getBalance({
              address: account.address,
            })

            console.log(balance)

            setWalletState({
              wallet,
              account,
              balance,
              requests: [],
              boosts: [],
              transfers: [],
            } as WalletState)
          })
          changeScreenState(SCREEN_STATE.LOADED)
          break
        default:
          changeScreenState(SCREEN_STATE.ABSENT)
      }
    }
  }, [
    params.position,
    walletState,
    agent,
    getByIndex,
    navigation,
    changeScreenState,
  ])

  useEffect(() => {
    if (screenState === SCREEN_STATE.ABSENT) {
      navigation.navigate('Wallets')
    }
  }, [navigation, screenState])

  if (screenState === SCREEN_STATE.LOADING) {
    return (
      <View>
        <Text>
          <Trans>LOADING...</Trans>
        </Text>
      </View>
    )
  } else if (walletState) {
    let content

    let walletAddress = getAddressFromPublicKey(
      getPublicKeyFromPrivateKey(walletState.wallet.privateKey),
    )

    content = (
      <>
        <View style={[a.p_3xl, a.gap_lg]}>
          <Text style={[a.text_md, a.font_bold]}>
            <Trans>Account</Trans>
          </Text>

          <View
            style={[
              a.p_2xl,
              a.flex_col,
              a.gap_2xl,
              a.rounded_md,
              t.atoms.bg_contrast_25,
            ]}>
            <View style={[a.flex_row, a.align_center]}>
              <View style={{flexBasis: 120}}>
                <Text
                  style={[
                    a.text_sm,
                    a.font_bold,
                    t.atoms.text_contrast_medium,
                    a.flex_grow,
                  ]}>
                  <Trans>Wallet address</Trans>
                </Text>
              </View>
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}>
                <Text ellipsizeMode="middle" numberOfLines={1}>
                  {walletAddress}
                </Text>
              </ScrollView>
              <View>
                <TouchableOpacity
                  onPress={() => shareUrl(walletAddress)}
                  accessibilityRole="button">
                  <Copy />
                </TouchableOpacity>
              </View>
            </View>
            <View style={[a.flex_row, a.align_center]}>
              <View style={{flexBasis: 120}}>
                <Text
                  style={[
                    a.text_sm,
                    a.font_bold,
                    t.atoms.text_contrast_medium,
                  ]}>
                  <Trans>Private key</Trans>
                </Text>
              </View>
              <View>
                <TouchableOpacity
                  onPress={() => saveWalletToFS(walletState.wallet.privateKey)}
                  accessibilityRole="button">
                  <DownloadIcon />
                </TouchableOpacity>
              </View>
            </View>
            <View style={[a.flex_row]}>
              <View style={{flexBasis: 120}}>
                <Text
                  style={[
                    a.text_sm,
                    a.font_bold,
                    t.atoms.text_contrast_medium,
                  ]}>
                  <Trans>Default token</Trans>
                </Text>
              </View>
              <View>
                <Text>{walletState.wallet.tag}</Text>
              </View>
            </View>
          </View>
          <Divider />
        </View>
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
                  {walletState?.balance.toString()}
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
                    openModal({
                      name: 'wallet-transfer',
                      currentBalance: walletState!.balance,
                      wallet: walletState.wallet,
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
      </>
    )

    return (
      <Layout.Screen>
        {
          <>
            <Layout.Header.Outer>
              <Layout.Header.BackButton />
              <Layout.Header.Content align="left">
                <Layout.Header.TitleText>
                  <Trans>
                    Wallet #<WalletAddress value={walletAddress} />
                  </Trans>
                </Layout.Header.TitleText>
              </Layout.Header.Content>
            </Layout.Header.Outer>
            <Layout.Content>{content}</Layout.Content>
          </>
        }
      </Layout.Screen>
    )
  }
}
