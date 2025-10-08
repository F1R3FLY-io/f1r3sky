import {useCallback, useState} from 'react'
import {ActivityIndicator, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {formatLargeNumber} from '#/lib/numbers'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {type NavigationProp} from '#/lib/routes/types'
import {useModalControls} from '#/state/modals'
import {useTipPrefs, useTipPrefsApi} from '#/state/preferences'
import {useWallets, WalletType} from '#/state/wallets'
import {PressableWithHover} from '#/view/com/util/PressableWithHover'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Divider} from '#/components/Divider'
import * as TextField from '#/components/forms/TextField'
import {AddWallet, Wallet} from '#/components/icons/Wallet'
import * as Layout from '#/components/Layout'
import * as Select from '#/components/Select'
import {Text} from '#/components/Typography'
import {WalletAddress} from '#/components/WalletAddress'

export function Wallets({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'Wallets'
>) {
  const {_} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const {openModal} = useModalControls()
  const tipPrefs = useTipPrefs()
  const {setDefaultTipAmount, setDefaultTippingWalletIndex} = useTipPrefsApi()
  const {wallets} = useWallets()
  const [amount, setAmount] = useState(tipPrefs?.defaultTipAmount || '10')
  const [balances, setBalances] = useState<Map<number, bigint>>(new Map())
  const [loadingBalances, setLoadingBalances] = useState<Set<number>>(new Set())

  // Function to fetch balances for all wallets
  const fetchBalances = useCallback(() => {
    wallets.forEach((wallet, index) => {
      if (wallet.walletType === WalletType.F1R3CAP && wallet.embers) {
        setLoadingBalances(prev => new Set(prev).add(index))
        wallet.embers.wallets
          .getWalletState()
          .then(state => {
            console.log(
              `[Wallets] Fetched balance for wallet ${index}:`,
              state.balance.toString(),
            )
            setBalances(prev => {
              const newMap = new Map(prev)
              newMap.set(index, state.balance)
              return newMap
            })
          })
          .catch(error => {
            console.error(
              `[Wallets] Failed to fetch balance for wallet ${index}:`,
              error,
            )
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

  // Refetch balances whenever the screen is focused (includes initial mount)
  useFocusEffect(
    useCallback(() => {
      fetchBalances()
    }, [fetchBalances]),
  )

  // Calculate total balance for proportions
  const totalBalance = Array.from(balances.values()).reduce(
    (sum, balance) => sum + balance,
    0n,
  )

  const onPressItem = (position: number) =>
    navigation.push('Wallet', {position: position + 1})

  const handleAmountChange = (text: string) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '')
    // Only allow one decimal point
    const parts = cleaned.split('.')
    const formatted =
      parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned

    setAmount(formatted)
    if (formatted && !isNaN(parseFloat(formatted))) {
      setDefaultTipAmount(formatted)
    }
  }

  const handleWalletChange = (value: string) => {
    const index = parseInt(value, 10)
    setDefaultTippingWalletIndex(index)
  }

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
        {wallets.length > 0 && (
          <View style={[a.px_2xl, a.pt_2xl, a.pb_md]}>
            <Text style={[a.text_lg, a.font_bold]}>
              <Trans>Your Wallets</Trans>
            </Text>
          </View>
        )}
        {wallets.map((wallet, i) => {
          const balance = balances.get(i)
          const isLoadingBalance = loadingBalances.has(i)
          const proportion =
            balance !== undefined && totalBalance > 0n
              ? Number((balance * 10000n) / totalBalance) / 100
              : 0

          return (
            <PressableWithHover
              key={i}
              hoverStyle={t.atoms.bg_contrast_25}
              onPress={() => onPressItem(i)}>
              <View style={[a.overflow_hidden]}>
                <View
                  style={[
                    a.flex_row,
                    a.align_center,
                    a.justify_between,
                    a.p_2xl,
                    a.gap_sm,
                  ]}>
                  <View
                    style={[a.flex_row, a.align_center, a.gap_sm, a.flex_1]}>
                    <View style={[{width: 24, height: 24}]}>
                      <Wallet />
                    </View>
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
                        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                          F1R3CAP
                        </Text>
                      </>
                    ) : null}
                  </View>
                </View>
                {/* Progress bar showing proportion of total funds */}
                {balance !== undefined && totalBalance > 0n && (
                  <View
                    style={[
                      {
                        height: 3,
                        backgroundColor: t.palette.contrast_100,
                      },
                    ]}>
                    <View
                      style={[
                        {
                          height: '100%',
                          width: `${proportion}%`,
                          backgroundColor: '#22c55e',
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
            </PressableWithHover>
          )
        })}
        <PressableWithHover
          hoverStyle={t.atoms.bg_contrast_25}
          onPress={() => openModal({name: 'create-wallet'})}>
          <View
            style={[a.flex_row, a.align_center, a.px_2xl, a.py_xl, a.gap_sm]}>
            <AddWallet />
            <Text style={[a.text_md]}>
              <Trans>Create new wallet</Trans>
            </Text>
          </View>
        </PressableWithHover>
        <PressableWithHover
          hoverStyle={t.atoms.bg_contrast_25}
          onPress={() => openModal({name: 'add-wallet'})}>
          <View
            style={[a.flex_row, a.align_center, a.px_2xl, a.py_xl, a.gap_sm]}>
            <AddWallet />
            <Text style={[a.text_md]}>
              <Trans>Add wallet</Trans>
            </Text>
          </View>
        </PressableWithHover>
        <Divider />
        {wallets.length > 0 && (
          <>
            <View style={[a.px_2xl, a.py_2xl]}>
              <Text style={[a.text_lg, a.font_bold]}>
                <Trans>Tipping Preferences</Trans>
              </Text>
            </View>
            <View style={[a.px_2xl, a.pb_md, a.gap_md]}>
              <View style={[a.gap_xs]}>
                <Text style={[a.text_md, a.font_bold]}>
                  <Trans>Default tip amount</Trans>
                </Text>
                <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                  <Trans>Amount in F1R3CAP tokens</Trans>
                </Text>
              </View>
              <TextField.Root>
                <TextField.Input
                  label={_(msg`Default tip amount`)}
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                  placeholder="10"
                />
              </TextField.Root>
            </View>
            <View style={[a.px_2xl, a.pb_2xl, a.gap_md]}>
              <View style={[a.gap_xs]}>
                <Text style={[a.text_md, a.font_bold]}>
                  <Trans>Default tipping wallet</Trans>
                </Text>
                <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                  <Trans>Select which wallet to use for sending tips</Trans>
                </Text>
              </View>
              <Select.Root
                value={String(tipPrefs?.defaultTippingWalletIndex ?? 0)}
                onValueChange={handleWalletChange}>
                <Select.Trigger label={_(msg`Select default tipping wallet`)}>
                  {({props}) => (
                    <Button
                      {...props}
                      label={props.accessibilityLabel}
                      size="small"
                      variant="solid"
                      color="secondary"
                      style={[a.w_full, a.justify_between]}>
                      <Select.ValueText
                        placeholder={_(msg`Select a wallet`)}
                        style={[t.atoms.text]}
                      />
                      <Select.Icon style={[t.atoms.text]} />
                    </Button>
                  )}
                </Select.Trigger>
                <Select.Content
                  renderItem={(item, index) => {
                    const wallet = wallets[index]
                    const balance = balances.get(index)
                    const isLoadingBalance = loadingBalances.has(index)
                    return (
                      <Select.Item
                        key={String(index)}
                        value={String(index)}
                        label={`Wallet #${wallet.address.value.slice(
                          0,
                          10,
                        )}...`}>
                        <View
                          style={[
                            a.flex_1,
                            a.flex_row,
                            a.align_center,
                            a.gap_sm,
                          ]}>
                          <Select.ItemIndicator />
                          <View style={[a.flex_1]}>
                            <Select.ItemText>
                              <Trans> Wallet </Trans> #
                              <WalletAddress value={wallet.address.value} />
                            </Select.ItemText>
                          </View>
                          {isLoadingBalance ? (
                            <ActivityIndicator size="small" />
                          ) : balance !== undefined ? (
                            <Text style={[a.text_sm, a.font_bold]}>
                              {formatLargeNumber(balance)}
                            </Text>
                          ) : null}
                        </View>
                      </Select.Item>
                    )
                  }}
                  items={wallets.map((_, idx) => idx)}
                  valueExtractor={idx => String(idx)}
                />
              </Select.Root>
            </View>
          </>
        )}
      </Layout.Content>
    </Layout.Screen>
  )
}
