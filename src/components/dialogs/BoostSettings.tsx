import React, {useEffect} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useTransferValidator} from '#/lib/wallet'
import {
  useEditUserBoostMutation,
  useUserBoostQuery,
} from '#/state/queries/wallet'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {FormError} from '#/components/forms/FormError'
import * as TextField from '#/components/forms/TextField'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

export function BoostSettingsDialog() {
  const control = Dialog.useDialogContext()

  const t = useTheme()
  const {_} = useLingui()

  const {currentAccount} = useSession()
  const {isLoading, data: boost} = useUserBoostQuery(currentAccount?.did)
  const [state, dispatch, error] = useTransferValidator([
    'address',
    'description',
  ])

  useEffect(() => {
    if (boost !== undefined) {
      dispatch({type: 'address', payload: [boost.walletAddress.value]})
      dispatch({type: 'description', payload: [boost.message]})
    }
  }, [boost, dispatch])

  const editBoost = useEditUserBoostMutation()

  const onSave = React.useCallback(async () => {
    if (isLoading) {
      return
    }

    if (
      state.address.state === 'valid' &&
      state.description.state === 'valid'
    ) {
      try {
        await editBoost.mutateAsync({
          walletAddress: state.address.value,
          message: state.description.value?.value,
        })
        Toast.show(_(msg`Boost config updated`), {type: 'success'})
      } catch {
        Toast.show(_(msg`Update failed`), {type: 'error'})
      }

      control.close()
    }
  }, [_, control, editBoost, isLoading, state])

  if (isLoading) {
    return (
      <Dialog.ScrollableInner label={_(msg`Transfer dialog`)}>
        <View style={[a.flex_col, a.justify_center, a.align_center, a.gap_lg]}>
          <Text style={[a.text_xl, a.font_bold]}>
            <Trans>Boost config</Trans>
          </Text>
          <Text
            style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
            <Trans>
              Let people know what you need help with {'\n'} or why they should
              support you.
            </Trans>
          </Text>
          <Loader size="xl" />

          <View style={[a.gap_sm, a.self_stretch]}>
            <Button
              color="secondary"
              size="large"
              onPress={() => control.close()}
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

  return (
    <Dialog.ScrollableInner label={_(msg`Transfer dialog`)}>
      <View style={[a.flex_col, a.justify_center, a.align_center, a.gap_lg]}>
        <Text style={[a.text_xl, a.font_bold]}>
          <Trans>Boost config</Trans>
        </Text>
        <Text style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
          <Trans>
            Let people know what you need help with {'\n'} or why they should
            support you.
          </Trans>
        </Text>
        <View style={[a.gap_sm, a.self_start, a.align_start, a.self_stretch]}>
          <TextField.LabelText>
            <Trans>Your wallet address</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={state.address.state === 'invalid'}>
            <TextField.Input
              label={_(msg`Add wallet address`)}
              defaultValue={boost?.walletAddress.value}
              onChangeText={address =>
                dispatch({
                  type: 'address',
                  payload: [address],
                })
              }
            />
          </TextField.Root>
        </View>
        <View style={[a.gap_sm, a.self_start, a.align_start, a.self_stretch]}>
          <TextField.LabelText>
            <Trans>Message</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={state.description.state === 'invalid'}>
            <TextField.Input
              label={_(msg`Note`)}
              defaultValue={boost?.message}
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
            disabled={editBoost.isPending}
            onPress={onSave}
            label={_(msg`Save`)}>
            <Text style={[a.text_sm, a.font_bold]}>
              <Trans>Save</Trans>
            </Text>
          </Button>
          <Button
            color="secondary"
            size="large"
            onPress={() => control.close()}
            disabled={editBoost.isPending}
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
