import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {type Address} from '@f1r3fly-io/embers-client-sdk'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeHandle} from '#/lib/strings/handles'
import {useTransferValidator} from '#/lib/wallet'
import {useTransferMutation, useWalletState} from '#/state/queries/wallet'
import {type UniWallet} from '#/state/wallets'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {FormError} from '#/components/forms/FormError'
import * as TextField from '#/components/forms/TextField'
import * as Select from '#/components/Select'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {Loaded} from '../Loaded'

export type WalletBoostProps = {
  destination: Address
  message?: string
  handle: string
  wallets: UniWallet[]
}

export function WalletBoost({
  destination,
  handle,
  wallets,
  message,
}: WalletBoostProps) {
  const t = useTheme()
  const {_} = useLingui()
  const control = Dialog.useDialogContext()

  const [[selectedWallet, selectedIndex], setSelectedWallet] = useState([
    wallets[0],
    0,
  ])

  const setSelectedWalletFromIndex = useCallback(
    (index: string) =>
      setSelectedWallet([wallets[Number(index)], Number(index)]),
    [wallets],
  )

  const [state, dispatch, error] = useTransferValidator([
    'amount',
    'description',
  ])

  const {mutateAsync: submit, isPending} = useTransferMutation(selectedWallet)
  const {data: walletState} = useWalletState(selectedWallet)

  const onSubmitClick = useCallback(async () => {
    if (walletState === undefined) {
      return
    }

    if (state.amount.state === 'valid' && state.description.state === 'valid') {
      try {
        await submit({
          amount: state.amount.value,
          toAddress: destination,
          description: state.description.value,
        })
        Toast.show(_(msg`Boost submitted`), {type: 'success'})
      } catch {
        Toast.show(_(msg`Boost failed`), {type: 'error'})
      }
      control.close()
    } else {
      dispatch({
        type: 'revalidateAll',
        payload: {
          amount: [walletState.balance],
          description: [],
        },
      })
    }
  }, [_, control, dispatch, walletState, destination, state, submit])

  return (
    <Dialog.ScrollableInner label={_(msg`Boost dialog`)}>
      <View style={[a.flex_col, a.justify_center, a.align_center, a.gap_lg]}>
        <Text style={[a.text_xl, a.font_bold]}>
          <Trans>Boost for</Trans> {sanitizeHandle(handle, '@')}
        </Text>
        {message && (
          <Text
            style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
            {message}
          </Text>
        )}
        <Loaded context={walletState}>
          {walletState => (
            <>
              <View
                style={[
                  a.gap_sm,
                  a.justify_center,
                  a.align_center,
                  a.self_stretch,
                ]}>
                <Text
                  style={[
                    a.text_sm,
                    a.font_bold,
                    a.mb_sm,
                    a.text_center,
                    t.atoms.text_contrast_medium,
                  ]}>
                  <Trans>Amount</Trans>
                </Text>

                <TextField.Root>
                  <TextField.Input
                    label={_(msg`Transfet amount`)}
                    placeholder="0.0"
                    keyboardType="numeric"
                    onChangeText={amount => {
                      let number
                      try {
                        number = BigInt(amount)
                      } catch (e) {
                        number = undefined
                      }

                      dispatch({
                        type: 'amount',
                        payload: [walletState.balance, number],
                      })
                    }}
                    isInvalid={state.amount.state === 'invalid'}
                    style={[
                      a.text_5xl,
                      a.font_bold,
                      a.text_center,
                      a.self_stretch,
                      a.py_xs,
                    ]}
                    noBackground
                  />
                </TextField.Root>
              </View>
              <View style={[a.flex_row, a.gap_sm]}>
                <Text
                  style={[
                    a.text_sm,
                    a.font_bold,
                    t.atoms.text_contrast_medium,
                  ]}>
                  <Trans>Available Balance</Trans>
                </Text>
                <Text style={[a.text_sm, a.font_bold]}>
                  {walletState.balance} F1R3CAP
                </Text>
              </View>
              <View
                style={[a.gap_sm, a.self_start, a.align_start, a.self_stretch]}>
                <TextField.LabelText>
                  <Trans>Your Wallet address</Trans>
                </TextField.LabelText>
                <Select.Root
                  value={String(selectedIndex)}
                  onValueChange={setSelectedWalletFromIndex}>
                  <Select.Trigger label={_(msg`Change wallet`)}>
                    {({props}) => (
                      <Button
                        {...props}
                        style={[a.self_stretch, a.justify_between]}
                        label={props.accessibilityLabel}
                        color="secondary"
                        size="small">
                        <Select.ValueText placeholder={_(msg`Change wallet`)} />
                        <Select.Icon />
                      </Button>
                    )}
                  </Select.Trigger>

                  <Select.Content
                    renderItem={(wallet, index) => (
                      <Select.Item
                        key={wallet.address.value + index}
                        value={String(index)}
                        label={wallet.address.value}>
                        <Select.ItemIndicator />
                        <Select.ItemText>
                          {wallet.address.value}
                        </Select.ItemText>
                      </Select.Item>
                    )}
                    items={wallets}
                  />
                </Select.Root>
              </View>
              <View
                style={[a.gap_sm, a.self_start, a.align_start, a.self_stretch]}>
                <TextField.LabelText>
                  <Trans>Note</Trans>
                </TextField.LabelText>
                <TextField.Root
                  isInvalid={state.description.state === 'invalid'}>
                  <TextField.Input
                    label={_(msg`Note`)}
                    placeholder={_(msg`Placeholder`)}
                    onChangeText={description =>
                      dispatch({
                        type: 'description',
                        payload: [description],
                      })
                    }
                    multiline
                  />
                </TextField.Root>
              </View>
              <FormError error={error} />
              <View style={[a.gap_sm, a.self_stretch]}>
                <Button
                  color="primary"
                  size="large"
                  disabled={isPending}
                  onPress={onSubmitClick}
                  label={_(msg`Boost`)}>
                  <Text style={[a.text_sm, a.font_bold]}>
                    <Trans>Boost</Trans>
                  </Text>
                </Button>
                <Button
                  color="secondary"
                  size="large"
                  onPress={() => control.close()}
                  disabled={isPending}
                  label={_(msg`Cancel`)}>
                  <Text style={[a.text_sm, a.font_bold]}>
                    <Trans>Cancel</Trans>
                  </Text>
                </Button>
              </View>
            </>
          )}
        </Loaded>
      </View>
    </Dialog.ScrollableInner>
  )
}
