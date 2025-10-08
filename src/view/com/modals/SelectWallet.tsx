import {useEffect, useState} from 'react'
import {ActivityIndicator, SafeAreaView, View} from 'react-native'
import {Trans} from '@lingui/macro'

import {usePalette} from '#/lib/hooks/usePalette'
import {formatLargeNumber} from '#/lib/numbers'
import {useModalControls} from '#/state/modals'
import {useWallets, WalletType} from '#/state/wallets'
import {PressableWithHover} from '#/view/com/util/PressableWithHover'
import {atoms as a, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {AddWallet, Wallet} from '#/components/icons/Wallet'
import {Text} from '#/components/Typography'
import {WalletAddress} from '#/components/WalletAddress'
import {ScrollView} from './util'

export const snapPoints = ['70%']

export type Props = {
  onSelectWallet: (walletIndex: number) => void
  onSelectWalletByAddress?: (walletAddress: string) => void
}

export function Component({onSelectWallet, onSelectWalletByAddress}: Props) {
  const t = useTheme()
  const pal = usePalette('default')
  const {closeModal, openModal} = useModalControls()
  const {wallets} = useWallets()
  const [balances, setBalances] = useState<Map<number, bigint>>(new Map())
  const [loadingBalances, setLoadingBalances] = useState<Set<number>>(new Set())

  useEffect(() => {
    // Fetch balances for all F1R3CAP wallets
    wallets.forEach((wallet, index) => {
      if (wallet.walletType === WalletType.F1R3CAP && wallet.embers) {
        setLoadingBalances(prev => new Set(prev).add(index))
        wallet.embers.wallets
          .getWalletState()
          .then(state => {
            setBalances(prev => new Map(prev).set(index, state.balance))
          })
          .catch(() => {
            // Ignore errors, just don't show balance
          })
          .finally(() => {
            setLoadingBalances(prev => {
              const next = new Set(prev)
              next.delete(index)
              return next
            })
          })
      }
    })
  }, [wallets])

  const handleSelectWallet = (index: number) => {
    // Use address callback if available, otherwise fall back to index
    if (onSelectWalletByAddress && wallets[index]) {
      onSelectWalletByAddress(wallets[index].address.value)
    } else {
      onSelectWallet(index)
    }
    closeModal()
  }

  return (
    <SafeAreaView style={[pal.view, a.flex_1]}>
      <ScrollView>
        <View style={[a.flex_col, a.gap_md, a.p_lg]}>
          <Text style={[a.text_xl, a.font_bold, a.text_center]}>
            <Trans>Select Wallet</Trans>
          </Text>
          <Text
            style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
            <Trans>Choose a wallet to attach to your post</Trans>
          </Text>

          <View style={[a.gap_xs, a.mt_md]}>
            {wallets.length > 0 ? (
              wallets.map((wallet, i) => {
                const balance = balances.get(i)
                const isLoadingBalance = loadingBalances.has(i)

                return (
                  <PressableWithHover
                    key={i}
                    hoverStyle={t.atoms.bg_contrast_25}
                    onPress={() => handleSelectWallet(i)}>
                    <View
                      style={[
                        a.flex_row,
                        a.align_center,
                        a.justify_between,
                        a.p_lg,
                        a.gap_md,
                      ]}>
                      <View
                        style={[
                          a.flex_row,
                          a.align_center,
                          a.gap_sm,
                          a.flex_1,
                        ]}>
                        <Wallet />
                        <Text style={[a.text_md]} numberOfLines={1}>
                          <Trans>Wallet</Trans> #
                          <WalletAddress value={wallet.address.value} />
                        </Text>
                      </View>
                      <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                        {isLoadingBalance ? (
                          <ActivityIndicator size="small" />
                        ) : balance !== undefined ? (
                          <>
                            <Text style={[a.text_md, a.font_bold]}>
                              {formatLargeNumber(balance)}
                            </Text>
                            <Text
                              style={[a.text_xs, t.atoms.text_contrast_medium]}>
                              F1R3CAP
                            </Text>
                          </>
                        ) : null}
                      </View>
                    </View>
                  </PressableWithHover>
                )
              })
            ) : (
              <View style={[a.p_lg, a.align_center]}>
                <Text
                  style={[
                    a.text_md,
                    t.atoms.text_contrast_medium,
                    a.text_center,
                  ]}>
                  <Trans>You don't have any wallets yet.</Trans>
                </Text>
              </View>
            )}
          </View>

          <Divider />

          <View style={[a.gap_xs]}>
            <PressableWithHover
              hoverStyle={t.atoms.bg_contrast_25}
              onPress={() => {
                openModal({
                  name: 'create-wallet',
                  skipNavigation: true,
                  onWalletCreated: () => {
                    // After wallet is created, re-open this selector modal
                    openModal({
                      name: 'select-wallet',
                      onSelectWallet,
                      onSelectWalletByAddress,
                    })
                  },
                })
              }}>
              <View style={[a.flex_row, a.align_center, a.p_lg, a.gap_sm]}>
                <AddWallet />
                <Text style={[a.text_md]}>
                  <Trans>Create new wallet</Trans>
                </Text>
              </View>
            </PressableWithHover>

            <PressableWithHover
              hoverStyle={t.atoms.bg_contrast_25}
              onPress={() => {
                openModal({
                  name: 'add-wallet',
                  skipNavigation: true,
                  onWalletAdded: () => {
                    // After wallet is added, re-open this selector modal
                    openModal({
                      name: 'select-wallet',
                      onSelectWallet,
                      onSelectWalletByAddress,
                    })
                  },
                })
              }}>
              <View style={[a.flex_row, a.align_center, a.p_lg, a.gap_sm]}>
                <AddWallet />
                <Text style={[a.text_md]}>
                  <Trans>Add existing wallet</Trans>
                </Text>
              </View>
            </PressableWithHover>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
