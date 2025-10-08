import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {DollarBill_Stroke2_Corner0_Rounded as DollarBillIcon} from '#/components/icons/DollarBill'

interface PostTipProps {
  walletAddress: string
}

export function PostTip({walletAddress}: PostTipProps) {
  const {_} = useLingui()
  const t = useTheme()

  const onPressTip = () => {
    // TODO: Open tip modal
    console.log('Tip button pressed for wallet address:', walletAddress)
  }

  return (
    <View style={[a.flex_row, a.align_center, a.pt_sm, a.pb_xs]}>
      <Button
        label={_(msg`Tip`)}
        accessibilityHint={_(msg`Send tip to this post`)}
        variant="ghost"
        shape="round"
        color="primary"
        size="small"
        style={[a.p_sm]}
        onPress={onPressTip}>
        <DollarBillIcon
          size="md"
          style={[{color: t.palette.contrast_500} as any]}
        />
      </Button>
    </View>
  )
}
