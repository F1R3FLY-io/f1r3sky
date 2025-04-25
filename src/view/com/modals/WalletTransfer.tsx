import {useCallback, useState} from 'react'
import {SafeAreaView, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePalette} from '#/lib/hooks/usePalette'
import {useModalControls} from '#/state/modals'
import {useTransferMutation} from '#/state/queries/wallet'
import {atoms as a, useTheme} from '#/alf'
import * as TextField from '#/components/forms/TextField'
import {Text} from '#/components/Typography'
import {Button} from '../util/forms/Button'
import {ScrollView} from './util'

export const snapPoints = ['90%']

export type Props = {
  currentBalance: number
}

export function Component({currentBalance}: Props) {
  const t = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const {closeModal} = useModalControls()

  const [amount, setAmount] = useState<number | null>(null)
  const [inputAmountValue, setInputAmountValue] = useState('')
  const setAmountInput = useCallback(
    (text: string) => {
      const amount = Number(text)

      if (isNaN(amount) || amount < 0) {
        return
      }

      setInputAmountValue(text)
      setAmount(amount)
    },
    [setAmount],
  )

  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')

  const {mutateAsync: submit, isPending} = useTransferMutation()

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
          <View style={[a.gap_sm]}>
            <Text
              style={[
                a.text_md,
                a.font_bold,
                a.text_center,
                t.atoms.text_contrast_medium,
              ]}>
              <Trans>Amount</Trans>
            </Text>
            <TextField.Input
              label={_(msg`Transfet amount`)}
              placeholder="0.0"
              keyboardType="numeric"
              value={inputAmountValue}
              onChangeText={setAmountInput}
            />
          </View>
          <View style={[a.flex_row, a.gap_sm]}>
            <Text
              style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
              <Trans>Available Balance</Trans>
            </Text>
            <Text style={[a.text_sm, a.font_bold]}>{currentBalance}</Text>
          </View>
          <View style={[a.gap_sm, a.self_start, a.align_start, a.self_stretch]}>
            <Text
              style={[
                a.text_md,
                a.font_bold,
                a.text_center,
                t.atoms.text_contrast_medium,
              ]}>
              <Trans>Receiver Wallet address</Trans>
            </Text>
            <TextField.Input
              label={_(msg`Add wallet address`)}
              onChangeText={setAddress}
            />
          </View>
          <View style={[a.gap_sm, a.self_start, a.align_start, a.self_stretch]}>
            <Text
              style={[
                a.text_md,
                a.font_bold,
                a.text_center,
                t.atoms.text_contrast_medium,
              ]}>
              <Trans>Note</Trans>
            </Text>
            <TextField.Input
              label={_(msg`Note`)}
              placeholder={_(msg`Placeholder`)}
              onChangeText={setDescription}
              multiline
            />
          </View>
          <View style={[a.gap_sm, a.self_stretch]}>
            <Button
              type="primary"
              onPress={() =>
                submit({
                  to_address: address,
                  description,
                  amount: amount!,
                }).then(() => {
                  closeModal()
                })
              }
              withLoading
              accessibilityLabel={_(msg`Transfer tokens`)}
              accessibilityHint=""
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
              accessibilityHint=""
              label={_(msg`Cancel`)}
              labelContainerStyle={[a.justify_center, a.p_xs]}
              labelStyle={[a.text_lg]}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
