import {useCallback, useReducer} from 'react'
import {View} from 'react-native'
import {Address, Amount, Description} from '@f1r3fly-io/embers-client-sdk'
import {msg, Trans} from '@lingui/macro'
import {type I18nContext, useLingui} from '@lingui/react'

import {useTransferMutation} from '#/state/queries/wallet'
import {type UniWallet} from '#/state/wallets'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {FormError} from '#/components/forms/FormError'
import * as TextField from '#/components/forms/TextField'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {Button} from './Button'

export type WalletTransferProps = {
  currentBalance: bigint
  wallet: UniWallet
}

export function WalletTransfer({currentBalance, wallet}: WalletTransferProps) {
  const t = useTheme()
  const {_} = useLingui()
  const control = Dialog.useDialogContext()

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

  const onSubmitClick = useCallback(async () => {
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
        Toast.show(_(msg`Transfer submitted`), {type: 'success'})
      } catch {
        Toast.show(_(msg`Transfer failed`), {type: 'error'})
      }
      control.close()
    } else {
      dispatch({
        type: 'revalidateAll',
        currentBalance,
        userAddress: wallet.address,
      })
    }
  }, [_, control, currentBalance, state, submit, wallet.address])

  return (
    <Dialog.ScrollableInner label={_(msg`Transfer dialog`)}>
      <View style={[a.flex_col, a.justify_center, a.align_center, a.gap_lg]}>
        <Text style={[a.text_xl, a.font_bold]}>
          <Trans>Transfer tokens</Trans>
        </Text>
        <Text style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
          <Trans>
            Set the amount, choose the receiver, add message and generate your
            request instantly.
          </Trans>
        </Text>
        <View
          style={[a.gap_sm, a.justify_center, a.align_center, a.self_stretch]}>
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
          <Text style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
            <Trans>Available Balance</Trans>
          </Text>
          <Text style={[a.text_sm, a.font_bold]}>
            {currentBalance.toString()} F1R3CAP
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
            color="primary"
            size="large"
            disabled={isPending}
            onPress={onSubmitClick}
            label={_(msg`Transfer tokens`)}>
            <Text style={[a.text_sm, a.font_bold]}>
              <Trans>Transfer tokens</Trans>
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
      </View>
    </Dialog.ScrollableInner>
  )
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
