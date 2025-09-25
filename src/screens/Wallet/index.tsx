import {useEffect, useState} from 'react'
import {TouchableOpacity, View} from 'react-native'
import {type WalletStateAndHistory} from '@f1r3fly-io/embers-client-sdk'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type RouteProp} from '@react-navigation/native'
import {useRoute} from '@react-navigation/native'
import {useNavigation} from '@react-navigation/native'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {type NavigationProp} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {saveWalletToFS} from '#/lib/wallet'
import {useModalControls} from '#/state/modals'
import {useWallets, WalletType} from '#/state/wallets'
import {Button} from '#/view/com/util/forms/Button'
import {atoms as a, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {Download_Stroke2_Corner0_Rounded as DownloadIcon} from '#/components/icons/Download'
import {Copy, Transfer, WalletTranscation} from '#/components/icons/Wallet'
import * as Layout from '#/components/Layout'
import {Loaded} from '#/components/Loaded'
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
  const {openModal} = useModalControls()
  const {getByIndex} = useWallets()
  const navigation = useNavigation<NavigationProp>()
  const {params} = useRoute<RouteProp<CommonNavigatorParams, 'Wallet'>>()

  const wallet = getByIndex(+params.position)
  const [walletState, setWalletState] = useState<WalletStateAndHistory>()
  const [screenState, changeScreenState] = useState(SCREEN_STATE.LOADING)

  useEffect(() => {
    if (wallet === undefined) {
      changeScreenState(SCREEN_STATE.ABSENT)
      return
    }

    switch (wallet.walletType) {
      case WalletType.F1R3CAP:
        wallet.embers?.wallets.getWalletState().then(state => {
          setWalletState(state)
          changeScreenState(SCREEN_STATE.LOADED)
        })
        break
      // todo dropped ethereum support for now
      // case WalletType.ETHEREUM:
      //   const account = privateKeyToAccount(wallet.privateKey)
      //
      //   const publicClient = createTestClient({
      //     account,
      //     chain: hardhat,
      //     mode: 'hardhat',
      //     transport: http(),
      //   })
      //     .extend(publicActions)
      //     .extend(walletActions)
      //
      //   publicClient
      //     .getBalance({
      //       address: account.address,
      //     })
      //     .then(async balance => {
      //       const blockNumber = await publicClient.getBlockNumber()
      //
      //       const endBlock = blockNumber
      //       const startBlock = endBlock === 0n ? 0n : endBlock - BigInt(1)
      //       const transfers = []
      //
      //       for (let i = startBlock; i <= endBlock; i++) {
      //         const block = await publicClient.getBlock({
      //           blockNumber: BigInt(i),
      //         })
      //
      //         for (const hash of block.transactions) {
      //           const transaction = await publicClient.getTransaction({
      //             hash,
      //           })
      //
      //           if (
      //             isAddressEqual(transaction.from, account.address) ||
      //             isAddressEqual(transaction.to!, account.address)
      //           ) {
      //             transfers.push({
      //               id: transaction.hash,
      //               direction: isAddressEqual(transaction.from, account.address)
      //                 ? ('outgoing' as const)
      //                 : ('incoming' as const),
      //               to_address: transaction.to!,
      //               cost: transaction.gas,
      //               amount: transaction.value,
      //               date: new Date(1000 * Number(block.timestamp)),
      //             })
      //           }
      //         }
      //       }
      //
      //       setWalletState({
      //         balance,
      //         requests: [],
      //         boosts: [],
      //         transfers,
      //       })
      //       changeScreenState(SCREEN_STATE.LOADED)
      //     })
      //
      //   break
      default:
        changeScreenState(SCREEN_STATE.ABSENT)
    }
  }, [wallet])

  useEffect(() => {
    if (screenState === SCREEN_STATE.ABSENT) {
      navigation.navigate('Wallets')
    }
  }, [navigation, screenState])

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Wallet</Trans> #
            <Loaded loaded={!!wallet} context={wallet}>
              {wallet => <WalletAddress value={wallet.address.value} />}
            </Loaded>
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
            <Loaded
              loaded={screenState === SCREEN_STATE.LOADED}
              context={wallet}>
              {wallet => (
                <>
                  <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                    <View style={{flexBasis: 110}}>
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
                    <Text style={[a.text_sm]} numberOfLines={1}>
                      {wallet.address.value}
                    </Text>
                    <TouchableOpacity
                      onPress={() => shareUrl(wallet.address.value)}
                      accessibilityRole="button">
                      <Copy />
                    </TouchableOpacity>
                  </View>
                  <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                    <View style={{flexBasis: 110}}>
                      <Text
                        style={[
                          a.text_sm,
                          a.font_bold,
                          t.atoms.text_contrast_medium,
                        ]}>
                        <Trans>Private key</Trans>
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => saveWalletToFS(wallet)}
                      accessibilityRole="button">
                      <DownloadIcon />
                    </TouchableOpacity>
                  </View>
                  <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                    <View style={{flexBasis: 110}}>
                      <Text
                        style={[
                          a.text_sm,
                          a.font_bold,
                          t.atoms.text_contrast_medium,
                        ]}>
                        <Trans>Default token</Trans>
                      </Text>
                    </View>
                    <Text>{wallet.walletType}</Text>
                  </View>
                </>
              )}
            </Loaded>
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
                <Loaded
                  loaded={screenState === SCREEN_STATE.LOADED}
                  context={walletState}>
                  {walletState => (
                    <>
                      <Layout.Header.TitleText>
                        {walletState?.balance.toString()}
                      </Layout.Header.TitleText>
                      <Text style={[a.text_xs, a.pb_xs]}>{'F1R3CAP'}</Text>
                    </>
                  )}
                </Loaded>
              </View>
              <Loaded
                loaded={screenState === SCREEN_STATE.LOADED}
                context={walletState}>
                {walletState => (
                  <WalletBalanceGraph walletState={walletState} />
                )}
              </Loaded>
              <View style={[a.self_start, a.pt_xl]}>
                <Loaded
                  loaded={screenState === SCREEN_STATE.LOADED}
                  context={walletState}>
                  {walletState => (
                    <Button
                      type="transparent-outline"
                      style={[{borderRadius: 6}]}
                      onPress={() => {
                        openModal({
                          name: 'wallet-transfer',
                          currentBalance: walletState.balance,
                          wallet: wallet!,
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
                  )}
                </Loaded>
              </View>
            </View>
          </View>
        </View>
        <Divider />
        <View style={[a.p_3xl, a.gap_lg, a.flex_row, a.align_center, a.gap_sm]}>
          <WalletTranscation />
          <Layout.Header.TitleText>
            <Trans>Transactions history</Trans>
          </Layout.Header.TitleText>
        </View>
        <Loaded
          loaded={screenState === SCREEN_STATE.LOADED}
          context={walletState}>
          {walletState => <TransactionHistory {...walletState} />}
        </Loaded>
      </Layout.Content>
    </Layout.Screen>
  )
}
