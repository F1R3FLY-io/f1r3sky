import {useEffect} from 'react'
import {TouchableOpacity, View} from 'react-native'
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
import {useWalletState} from '#/state/queries/wallet'
import {useWallets} from '#/state/wallets'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import * as Dialog from '#/components/Dialog'
import {WalletTransfer} from '#/components/dialogs/WalletTransfer'
import {Divider} from '#/components/Divider'
import {Download_Stroke2_Corner0_Rounded as DownloadIcon} from '#/components/icons/Download'
import {Copy, Transfer, WalletTranscation} from '#/components/icons/Wallet'
import * as Layout from '#/components/Layout'
import {Loaded} from '#/components/Loaded'
import {TransactionHistory} from '#/components/TransactionHistory'
import {Text} from '#/components/Typography'
import {WalletAddress} from '#/components/WalletAddress'
import WalletBalanceGraph from '../Wallets/WalletBalanceGraph'

export function Wallet({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'Wallet'
>) {
  const t = useTheme()
  const {_} = useLingui()
  const control = useDialogControl()
  const {getByIndex} = useWallets()
  const navigation = useNavigation<NavigationProp>()
  const {params} = useRoute<RouteProp<CommonNavigatorParams, 'Wallet'>>()

  const wallet = getByIndex(+params.position)
  const {data: walletState} = useWalletState(wallet)

  useEffect(() => {
    wallet === undefined && navigation.navigate('Wallets')
  }, [navigation, wallet])

  if (wallet === undefined) {
    return null
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Wallet</Trans> #
            <WalletAddress value={wallet.address.value} />
          </Layout.Header.TitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>
      <Layout.Content>
        <View style={[a.p_3xl, a.gap_lg]}>
          <Text style={[a.text_md, a.font_bold, t.atoms.text_contrast_medium]}>
            <Trans>General info</Trans>
          </Text>
          <View
            style={[
              a.p_2xl,
              a.flex_col,
              a.gap_2xl,
              a.rounded_md,
              t.atoms.bg_contrast_50,
            ]}>
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
                onPress={() => saveWalletToFS(wallet.privateKey)}
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
              <Text>F1R3CAP</Text>
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
          <View style={[a.rounded_md, t.atoms.bg_contrast_50]}>
            <View style={[a.p_2xl]}>
              <Loaded loader context={walletState}>
                {walletState => (
                  <>
                    <View style={[a.flex_row, a.align_end, a.gap_sm]}>
                      <Layout.Header.TitleText>
                        {walletState.balance}
                      </Layout.Header.TitleText>
                      <Text style={[a.text_xs, a.pb_xs]}>F1R3CAP</Text>
                    </View>
                    <WalletBalanceGraph
                      address={wallet.address}
                      {...walletState}
                    />
                    <View style={[a.self_start, a.pt_xl]}>
                      <Button
                        color="secondary"
                        size="small"
                        label={_(msg`Transfer`)}
                        style={[
                          a.border,
                          a.rounded_xs,
                          {
                            borderColor: t.palette.primary_500,
                          },
                        ]}
                        onPress={control.open}>
                        <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                          <Transfer />
                          <Text style={[a.text_sm, a.font_bold]}>
                            <Trans>Transfer</Trans>
                          </Text>
                        </View>
                      </Button>
                    </View>
                  </>
                )}
              </Loaded>
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
        <Loaded loader context={walletState}>
          {walletState => (
            <TransactionHistory address={wallet.address} {...walletState} />
          )}
        </Loaded>
        <Loaded context={walletState}>
          {walletState => (
            <Dialog.Outer
              control={control}
              nativeOptions={{preventExpansion: true}}>
              <Dialog.Handle />
              <WalletTransfer
                currentBalance={walletState.balance}
                wallet={wallet!}
              />
            </Dialog.Outer>
          )}
        </Loaded>
      </Layout.Content>
    </Layout.Screen>
  )
}
