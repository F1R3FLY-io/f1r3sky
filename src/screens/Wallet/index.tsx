import {useEffect, useState} from 'react'
import {ScrollView, TouchableOpacity, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type RouteProp} from '@react-navigation/native'
import {useRoute} from '@react-navigation/native'
import {useNavigation} from '@react-navigation/native'
import {
  createTestClient,
  http,
  isAddressEqual,
  publicActions,
  walletActions,
} from 'viem'
import {privateKeyToAccount} from 'viem/accounts'
import {hardhat} from 'viem/chains'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {type NavigationProp} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {fetchF1r3SkyWalletState, saveWalletToFS} from '#/lib/wallet'
import {useModalControls} from '#/state/modals'
import {type WalletState} from '#/state/queries/wallet'
import {useAgent} from '#/state/session'
import {useWallets, WalletType} from '#/state/wallets'
import {Button} from '#/view/com/util/forms/Button'
import {atoms as a, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {Download_Stroke2_Corner0_Rounded as DownloadIcon} from '#/components/icons/Download'
import {Copy, Transfer, WalletTranscation} from '#/components/icons/Wallet'
import * as Layout from '#/components/Layout'
import {TransactionHistory} from '#/components/TransactionHistory'
import {Text} from '#/components/Typography'
import {WalletAddress} from '#/components/WalletAddress'
import WalletBalanceGraph from '../Wallets/WalletBalanceGraph'

enum SCREEN_STATE {
  LOADING,
  LOADED,
  ABSENT,
  ERROR,
}

export function Wallet({}: NativeStackScreenProps<
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
    const wallet = getByIndex(+params.position)

    if (wallet === undefined) {
      changeScreenState(SCREEN_STATE.ABSENT)
      return
    }

    switch (wallet.walletType) {
      case WalletType.F1R3CAP:
        fetchF1r3SkyWalletState(wallet).then(state => {
          setWalletState({wallet, ...state})
          changeScreenState(SCREEN_STATE.LOADED)
        })
        break
      case WalletType.ETHERIUM:
        const account = privateKeyToAccount(wallet.privateKey)

        const publicClient = createTestClient({
          account,
          chain: hardhat,
          mode: 'hardhat',
          transport: http(),
        })
          .extend(publicActions)
          .extend(walletActions)

        publicClient
          .getBalance({
            address: account.address,
          })
          .then(async balance => {
            const blockNumber = await publicClient.getBlockNumber()

            const endBlock = blockNumber
            const startBlock = endBlock === 0n ? 0n : endBlock - BigInt(1)
            const transfers = []

            for (let i = startBlock; i <= endBlock; i++) {
              const block = await publicClient.getBlock({
                blockNumber: BigInt(i),
              })

              for (const hash of block.transactions) {
                const transaction = await publicClient.getTransaction({
                  hash,
                })

                if (
                  isAddressEqual(transaction.from, account.address) ||
                  isAddressEqual(transaction.to!, account.address)
                ) {
                  transfers.push({
                    id: transaction.hash,
                    direction: isAddressEqual(transaction.from, account.address)
                      ? 'outgoing'
                      : 'incoming',
                    to_address: transaction.to!,
                    cost: transaction.gas,
                    amount: transaction.value,
                    date: new Date(1000 * Number(block.timestamp)),
                  })
                }
              }
            }

            setWalletState({
              wallet,
              balance,
              requests: [],
              boosts: [],
              transfers,
            } as WalletState)
            changeScreenState(SCREEN_STATE.LOADED)
          })

        break
      default:
        changeScreenState(SCREEN_STATE.ABSENT)
    }
  }, [agent, getByIndex, params.position])

  useEffect(() => {
    if (screenState === SCREEN_STATE.ABSENT) {
      navigation.navigate('Wallets')
    }
  }, [navigation, screenState])

  if (screenState === SCREEN_STATE.LOADING) {
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
                a.flex_col,
                a.gap_2xl,
                a.rounded_md,
                t.atoms.bg_contrast_25,
              ]}
            />
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
                <View style={[a.flex_row, a.align_end, a.gap_sm]} />
                <View style={[a.self_start, a.pt_xl]} />
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
            <View
              style={[
                a.p_2xl,
                a.flex_col,
                a.gap_2xl,
                a.rounded_md,
                t.atoms.bg_contrast_25,
              ]}
            />
          </View>
        </Layout.Content>
      </Layout.Screen>
    )
  } else if (undefined !== walletState) {
    const coinName: string =
      walletState.wallet.walletType === WalletType.ETHERIUM ? 'WEI' : 'F1R3CAP'

    return (
      <Layout.Screen>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content align="left">
            <Layout.Header.TitleText>
              <Trans>Wallet</Trans>#
              <WalletAddress value={walletState.wallet.address} />
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
                    {walletState.wallet.address}
                  </Text>
                </ScrollView>
                <View>
                  <TouchableOpacity
                    onPress={() => shareUrl(walletState.wallet.address)}
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
                    onPress={() =>
                      saveWalletToFS(
                        walletState.wallet.privateKey,
                        walletState.wallet.address,
                        walletState.wallet.walletType,
                      )
                    }
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
                  <Text>{walletState.wallet.walletType}</Text>
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
                  <Text style={[a.text_xs, a.pb_xs]}>{coinName}</Text>
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
        </Layout.Content>
      </Layout.Screen>
    )
  }
}
