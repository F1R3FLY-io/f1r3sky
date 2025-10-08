import {useEffect, useRef, useState} from 'react'
import {Animated, View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {Address, Amount} from '@f1r3fly-io/embers-client-sdk'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeHandle} from '#/lib/strings/handles'
import {useTipPrefs} from '#/state/preferences'
import {useTransferMutation} from '#/state/queries/wallet'
import {type FireCAPWallet, useWallets} from '#/state/wallets'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {DollarBill_Stroke2_Corner0_Rounded as DollarBillIcon} from '#/components/icons/DollarBill'
import {Text} from '#/components/Typography'

interface PostTipProps {
  walletAddress: string
  postAuthor: AppBskyActorDefs.ProfileViewBasic
}

export function PostTip({walletAddress, postAuthor}: PostTipProps) {
  const {_} = useLingui()
  const t = useTheme()
  const tipPrefs = useTipPrefs()
  const {wallets} = useWallets()
  const [isTipping, setIsTipping] = useState(false)
  const [tipped, setTipped] = useState(false)

  // Animation values
  const buttonScale = useRef(new Animated.Value(1)).current
  const buttonColor = useRef(new Animated.Value(0)).current
  const floatingNumberOpacity = useRef(new Animated.Value(0)).current
  const floatingNumberY = useRef(new Animated.Value(0)).current

  const tippingWalletIndex = tipPrefs?.defaultTippingWalletIndex ?? 0
  const tippingWallet = wallets[tippingWalletIndex] as FireCAPWallet | undefined
  const tipAmount = tipPrefs?.defaultTipAmount || '10'

  const {mutateAsync: sendTransfer} = useTransferMutation(
    tippingWallet as FireCAPWallet,
  )

  useEffect(() => {
    if (tipped) {
      // Animate button to green
      Animated.parallel([
        Animated.spring(buttonScale, {
          toValue: 1.1,
          useNativeDriver: true,
          friction: 3,
        }),
        Animated.timing(buttonColor, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(() => {
        // Animate floating number
        Animated.parallel([
          Animated.timing(floatingNumberOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(floatingNumberY, {
            toValue: -40,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Fade out and reset
          Animated.timing(floatingNumberOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // Reset animations
            buttonScale.setValue(1)
            buttonColor.setValue(0)
            floatingNumberY.setValue(0)
          })
        })
      })
    }
  }, [tipped, buttonScale, buttonColor, floatingNumberOpacity, floatingNumberY])

  const onPressTip = async () => {
    if (!tippingWallet || isTipping || tipped) return

    try {
      setIsTipping(true)

      // Start animation immediately
      setTipped(true)

      const toAddress = Address.tryFrom(walletAddress)
      const amount = Amount.tryFrom(BigInt(parseFloat(tipAmount) * 100000000)) // Convert to smallest unit

      // Send transaction
      await sendTransfer({
        amount,
        toAddress,
        description: undefined,
      })

      // Show success toast after transaction confirms
      const handle = sanitizeHandle(postAuthor.handle, '@')
      Toast.show(_(msg`Tipped ${tipAmount} to ${handle}`), 'check')
    } catch (error) {
      console.error('Tip failed:', error)
      Toast.show(_(msg`Tip failed`), 'xmark')
      // Reset animation on error
      setTipped(false)
    } finally {
      setIsTipping(false)
    }
  }

  const backgroundColor = buttonColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#22c55e'], // transparent to green
  })

  return (
    <View>
      <Animated.View
        style={{
          transform: [{scale: buttonScale}],
          backgroundColor: tipped ? backgroundColor : 'transparent',
          borderRadius: 999,
        }}>
        <Button
          label={_(msg`Tip`)}
          accessibilityHint={_(msg`Send tip to this post`)}
          variant="ghost"
          shape="round"
          color="secondary"
          hoverStyle={tipped ? undefined : t.atoms.bg_contrast_25}
          style={[a.p_sm, a.bg_transparent]}
          onPress={onPressTip}
          disabled={!tippingWallet || isTipping || tipped}>
          <DollarBillIcon
            size="md"
            style={[
              {
                color: tipped ? '#ffffff' : (t.palette.contrast_500 as string),
              } as any,
            ]}
          />
        </Button>
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: [{translateX: -20}, {translateY: floatingNumberY}],
            opacity: floatingNumberOpacity,
          },
        ]}
        pointerEvents="none">
        <Text
          style={[
            a.text_md,
            a.font_bold,
            {
              color: '#22c55e',
            },
          ]}>
          +{tipAmount}
        </Text>
      </Animated.View>
    </View>
  )
}
