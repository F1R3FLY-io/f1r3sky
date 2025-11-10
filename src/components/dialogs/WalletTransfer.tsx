import {useCallback} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useTransferValidator} from '#/lib/wallet'
import {useTransferMutation} from '#/state/queries/wallet'
import {type UniWallet} from '#/state/wallets'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {FormError} from '#/components/forms/FormError'
import * as TextField from '#/components/forms/TextField'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

export type WalletTransferProps = {
  currentBalance: bigint
  wallet: UniWallet
}

export function WalletTransfer(props: WalletTransferProps) {
  const t = useTheme()
  const {_} = useLingui()
  const control = Dialog.useDialogContext()

  const [state, dispatch, error] = useTransferValidator([
    'amount',
    'transferAddress',
    'description',
  ])

  const {mutateAsync: submit, isPending} = useTransferMutation(props.wallet)

  const onSubmitClick = useCallback(async () => {
    if (
      state.amount.state === 'valid' &&
      state.transferAddress.state === 'valid' &&
      state.description.state === 'valid'
    ) {
      try {
        await submit({
          amount: state.amount.value,
          toAddress: state.transferAddress.value,
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
        payload: {
          amount: [props.currentBalance],
          transferAddress: [props.wallet.address.value],
          description: [],
        },
      })
    }
  }, [
    _,
    control,
    dispatch,
    state,
    props.currentBalance,
    props.wallet.address.value,
    submit,
  ])

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
                  type: 'amount',
                  payload: [props.currentBalance, number],
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
            {props.currentBalance} F1R3CAP
          </Text>
        </View>
        <View style={[a.gap_sm, a.self_start, a.align_start, a.self_stretch]}>
          <TextField.LabelText>
            <Trans>Receiver Wallet address</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={state.transferAddress.state === 'invalid'}>
            <TextField.Input
              label={_(msg`Add wallet address`)}
              onChangeText={address =>
                dispatch({
                  type: 'transferAddress',
                  payload: [props.wallet.address.value, address],
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
