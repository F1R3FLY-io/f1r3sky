import {useReducer} from 'react'
import {SafeAreaView, View} from 'react-native'
import {Address, Amount, Description} from '@f1r3fly-io/embers-client-sdk'
import {msg, Trans} from '@lingui/macro'
import {type I18nContext, useLingui} from '@lingui/react'

import {usePalette} from '#/lib/hooks/usePalette'
import {useModalControls} from '#/state/modals'
import {useTransferMutation} from '#/state/queries/wallet'
import {type UniWallet} from '#/state/wallets'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {FormError} from '#/components/forms/FormError'
import * as TextField from '#/components/forms/TextField'
import {Text} from '#/components/Typography'
import {Button} from '../util/forms/Button'
import {ScrollView} from './util'

export const snapPoints = ['90%']

export type Props = {
  currentBalance: bigint
  wallet: UniWallet
}

export function Component({currentBalance, wallet}: Props) {
  const t = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const {closeModal} = useModalControls()

  const [state, dispatch] = useReducer(
    (state: ControlState, action: TransferAction) =>
      handleTransferAction(wallet, state, action),
    {
      amount: {
        state: 'empty',
      },
      address: {
        state: 'empty',
      },
      description: {
        state: 'valid',
      },
    },
  )

  const error = formatErrorMsg(_, state)

  const {mutateAsync: submit, isPending} = useTransferMutation(wallet)

  const currencySymbol = 'F1R3CAP'

  return (
    <SafeAreaView style={[pal.view, a.flex_1]}>
      <ScrollView>
        <View style={[a.flex_col, a.justify_center, a.align_center, a.gap_lg]}>
          <Text style={[a.text_xl, a.font_bold]}>
            <Trans>Transfer tokens</Trans>
          </Text>
          <Text
            style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
            <Trans>
              Set the amount, choose the receiver, add message and generate your
              request instantly.
            </Trans>
          </Text>
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
                    type: 'setAmount',
                    amount: number,
                    currentBalance,
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
              style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
              <Trans>Available Balance</Trans>
            </Text>
            <Text style={[a.text_sm, a.font_bold]}>
              {currentBalance.toString()} {currencySymbol}
            </Text>
          </View>
          <View style={[a.gap_sm, a.self_start, a.align_start, a.self_stretch]}>
            <TextField.LabelText>
              <Trans>Receiver Wallet address</Trans>
            </TextField.LabelText>
            <TextField.Root isInvalid={state.address.state === 'invalid'}>
              <TextField.Input
                label={_(msg`Add wallet address`)}
                onChangeText={address =>
                  dispatch({
                    type: 'setAddress',
                    address,
                    userAddress: wallet.address,
                  })
                }
              />
            </TextField.Root>
          </View>
          <View style={[a.gap_sm, a.self_start, a.align_start, a.self_stretch]}>
            <TextField.LabelText>
              <Trans>Note</Trans>
            </TextField.LabelText>
            <TextField.Root isInvalid={state.description.state === 'invalid'}>
              <TextField.Input
                label={_(msg`Note`)}
                placeholder={_(msg`Placeholder`)}
                onChangeText={description =>
                  dispatch({
                    type: 'setDescription',
                    description,
                  })
                }
                multiline
              />
            </TextField.Root>
          </View>
          <FormError error={error} />
          <View style={[a.gap_sm, a.self_stretch]}>
            <Button
              type="primary"
              onPress={onSubmitClick}
              withLoading
              accessibilityLabel={_(msg`Transfer tokens`)}
              accessibilityHint={_(msg`Click to transfer transfer`)}
              label={_(msg`Transfer tokens`)}
              labelContainerStyle={[a.justify_center, a.p_xs]}
              labelStyle={[a.text_lg]}
            />
            <Button
              type="default"
              onPress={() => {
                closeModal()
              }}
              disabled={isPending}
              accessibilityLabel={_(msg`Cancel`)}
              accessibilityHint={_(msg`Click to cancel transfer`)}
              label={_(msg`Cancel`)}
              labelContainerStyle={[a.justify_center, a.p_xs]}
              labelStyle={[a.text_lg]}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )

  async function onSubmitClick() {
    if (
      state.amount.state === 'valid' &&
      state.address.state === 'valid' &&
      state.description.state === 'valid'
    ) {
      try {
        await submit({
          amount: state.amount.value,
          toAddress: state.address.value,
          description: state.description.value,
        })
        Toast.show(_(msg`Transfer submitted`), 'clipboard-check')
      } catch {
        Toast.show(_(msg`Transfer failed`), 'cloud-xmark')
      }
      closeModal()
    } else {
      dispatch({
        type: 'revalidateAll',
        currentBalance,
        userAddress: wallet.address,
      })
    }
  }
}

type ControlState = {
  amount:
    | {
        state: 'valid'
        value: Amount
      }
    | {
        state: 'invalid'
        value?: bigint
        error: 'invalid' | 'lowBalance'
      }
    | {
        state: 'empty'
      }
  address:
    | {
        state: 'valid'
        value: Address
      }
    | {
        state: 'invalid'
        value?: string
        error: 'invalid' | 'sameAddress'
      }
    | {
        state: 'empty'
      }
  description:
    | {
        state: 'valid'
        value?: Description
      }
    | {
        state: 'invalid'
        value?: string
        error: 'invalid'
      }
}

type TransferAction =
  | {
      type: 'setAmount'
      amount?: bigint
      currentBalance: bigint
    }
  | {type: 'setAddress'; address?: string; userAddress: Address}
  | {type: 'setDescription'; description?: string}
  | {type: 'revalidateAll'; currentBalance: bigint; userAddress: Address}

export const handleTransferAction = (
  wallet: UniWallet,
  state: ControlState,
  action: TransferAction,
): ControlState => {
  switch (action.type) {
    case 'setAmount': {
      const thisProp = 'amount'
      if (action.amount === undefined) {
        return {
          ...state,
          [thisProp]: {
            state: 'invalid',
            value: action.amount,
            error: 'invalid',
          },
        }
      }

      try {
        let amount = Amount.tryFrom(action.amount)

        if (amount.value > action.currentBalance) {
          return {
            ...state,
            [thisProp]: {
              state: 'invalid',
              value: amount.value,
              error: 'lowBalance',
            },
          }
        }

        return {
          ...state,
          [thisProp]: {
            state: 'valid',
            value: amount,
          },
        }
      } catch (e) {
        return {
          ...state,
          [thisProp]: {
            state: 'invalid',
            value: action.amount,
            error: 'invalid',
          },
        }
      }
    }
    case 'setAddress': {
      const thisProp = 'address'

      if (action.address === undefined) {
        return {
          ...state,
          [thisProp]: {
            state: 'invalid',
            value: action.address,
            error: 'invalid',
          },
        }
      }

      try {
        let address = Address.tryFrom(action.address)

        if (address.value === action.userAddress.value) {
          return {
            ...state,
            [thisProp]: {
              state: 'invalid',
              value: address.value,
              error: 'sameAddress',
            },
          }
        }

        return {
          ...state,
          [thisProp]: {
            state: 'valid',
            value: address,
          },
        }
      } catch (e) {
        return {
          ...state,
          [thisProp]: {
            state: 'invalid',
            value: action.address,
            error: 'invalid',
          },
        }
      }
    }
    case 'setDescription': {
      const thisProp = 'description'
      if (action.description === undefined) {
        return {
          ...state,
          [thisProp]: {
            state: 'valid',
            value: action.description,
          },
        }
      }

      try {
        let description = Description.tryFrom(action.description)

        return {
          ...state,
          [thisProp]: {
            state: 'valid',
            value: description,
          },
        }
      } catch (e) {
        return {
          ...state,
          [thisProp]: {
            state: 'invalid',
            value: action.description,
            error: 'invalid',
          },
        }
      }
    }
    case 'revalidateAll': {
      let newState = handleTransferAction(wallet, state, {
        type: 'setAmount',
        amount:
          state.amount.state === 'empty'
            ? undefined
            : state.amount.state === 'invalid'
            ? state.amount.value
            : state.amount.value.value,
        currentBalance: action.currentBalance,
      })

      newState = handleTransferAction(wallet, newState, {
        type: 'setAddress',
        address:
          state.address.state === 'empty'
            ? undefined
            : state.address.state === 'invalid'
            ? state.address.value
            : state.address.value.value,
        userAddress: action.userAddress,
      })

      return handleTransferAction(wallet, newState, {
        type: 'setDescription',
        description:
          state.description.state === 'invalid'
            ? state.description.value
            : state.description.value?.value,
      })
    }
  }
}

function formatErrorMsg(
  _: I18nContext['_'],
  state: ControlState,
): string | undefined {
  if (state.amount.state === 'invalid') {
    switch (state.amount.error) {
      case 'invalid':
        return _(msg`Invalid amount`)
      case 'lowBalance':
        return _(msg`Not enough funds for transfer`)
    }
  }

  if (state.address.state === 'invalid') {
    switch (state.address.error) {
      case 'invalid':
        return _(msg`Invalid address`)
      case 'sameAddress':
        return _(msg`Destination address and source address are the same`)
    }
  }

  if (state.description.state === 'invalid') {
    switch (state.description.error) {
      case 'invalid':
        return _(msg`Description is too long`)
    }
  }
}
