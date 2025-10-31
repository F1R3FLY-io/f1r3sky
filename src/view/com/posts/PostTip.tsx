import {useEffect, useRef, useState} from 'react'
import {Animated, View} from 'react-native'
import {type AppBskyActorDefs, type AppBskyFeedDefs} from '@atproto/api'
import {Address, Amount} from '@f1r3fly-io/embers-client-sdk'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {formatLargeNumber} from '#/lib/numbers'
import {sanitizeHandle} from '#/lib/strings/handles'
import {type Shadow} from '#/state/cache/types'
import {useTipPrefs} from '#/state/preferences'
import {usePostTipMutation} from '#/state/queries/tip'
import {useTransferMutation} from '#/state/queries/wallet'
import {type FireCAPWallet, useWallets} from '#/state/wallets'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {DollarBill_Stroke2_Corner0_Rounded} from '#/components/icons/DollarBill'
import {Text} from '#/components/Typography'

const AnimatedDollarBillIcon = Animated.createAnimatedComponent(
  DollarBill_Stroke2_Corner0_Rounded,
)

interface PostTipProps {
  post: Shadow<AppBskyFeedDefs.PostView>
  walletAddress: string
  postAuthor: AppBskyActorDefs.ProfileViewBasic
}

export function PostTip({post, walletAddress, postAuthor}: PostTipProps) {
  const {_} = useLingui()
  const t = useTheme()
  const tipPrefs = useTipPrefs()
  const {wallets} = useWallets()
  const [isTipping, setIsTipping] = useState(false)
  const [justTipped, setJustTipped] = useState(false)

  // Get persisted hasTipped state from post shadow
  const hasTipped = (post as any).hasTipped ?? false

  // Animation values
  const buttonScale = useRef(new Animated.Value(1)).current
  const buttonColor = useRef(new Animated.Value(hasTipped ? 2 : 0)).current
  const floatingNumberOpacity = useRef(new Animated.Value(0)).current
  const floatingNumberY = useRef(new Animated.Value(0)).current

  const tippingWalletIndex = tipPrefs?.defaultTippingWalletIndex ?? 0
  const tippingWallet = wallets[tippingWalletIndex] as FireCAPWallet | undefined
  const tipAmount = tipPrefs?.defaultTipAmount || '10'

  const {mutateAsync: sendTransfer} = useTransferMutation(
    tippingWallet as FireCAPWallet,
  )
  const queueTip = usePostTipMutation(post)

  // Get current tip data from post (these values update reactively from the shadow)
  const currentTotalAmount = (post as any).totalTipsAmount ?? '0'

  // Track optimistic total for instant display updates
  const [optimisticTotal, setOptimisticTotal] = useState<string | null>(null)
  const displayTotal = optimisticTotal ?? currentTotalAmount

  useEffect(() => {
    if (justTipped) {
      // Animate button to bright green
      Animated.parallel([
        Animated.spring(buttonScale, {
          toValue: 1.1,
          useNativeDriver: true,
          friction: 3,
        }),
        Animated.timing(buttonColor, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        // Animate back to normal size but keep green
        Animated.spring(buttonScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 3,
        }).start()
      })

      // Animate floating number
      Animated.parallel([
        Animated.timing(floatingNumberOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(floatingNumberY, {
          toValue: -30,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Fade out
        Animated.timing(floatingNumberOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          // Reset floating number position (but keep color green)
          buttonScale.setValue(1)
          floatingNumberY.setValue(0)
        })
      })

      // Reset justTipped state after 5 seconds to allow tipping again
      const timeout = setTimeout(() => {
        // Animate to darker green to show it's been tipped
        Animated.timing(buttonColor, {
          toValue: 2,
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          setJustTipped(false)
        })
      }, 5000)

      return () => clearTimeout(timeout)
    }
  }, [
    justTipped,
    buttonScale,
    buttonColor,
    floatingNumberOpacity,
    floatingNumberY,
  ])

  const onPressTip = async () => {
    if (!tippingWallet || isTipping || justTipped) return

    try {
      setIsTipping(true)

      const tipAmountInSmallestUnits = BigInt(parseFloat(tipAmount) * 100000000) // Convert to smallest unit

      // Update display total immediately (optimistic update)
      const newTotal = (
        BigInt(displayTotal) + tipAmountInSmallestUnits
      ).toString()
      setOptimisticTotal(newTotal)

      // Start animation immediately
      setJustTipped(true)

      const toAddress = Address.tryFrom(walletAddress)
      const amount = Amount.tryFrom(tipAmountInSmallestUnits)

      // Send blockchain transaction
      await sendTransfer({
        amount,
        toAddress,
        description: undefined,
      })

      // Create tip record in ATProto (this will update the post shadow with hasTipped)
      await queueTip(tipAmountInSmallestUnits.toString(), walletAddress)

      // Clear optimistic total now that real data is updated
      setOptimisticTotal(null)

      // Show success toast after transaction confirms
      const handle = sanitizeHandle(postAuthor.handle, '@')
      Toast.show(_(msg`Tipped ${tipAmount} to ${handle}`), 'check')
    } catch (error) {
      console.error('Tip failed:', error)
      Toast.show(_(msg`Tip failed`), 'xmark')
      // Reset animation and optimistic update on error
      setJustTipped(false)
      setOptimisticTotal(null)
    } finally {
      setIsTipping(false)
    }
  }

  const iconColor = buttonColor.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      t.palette.contrast_500 as string, // gray (untipped)
      '#22c55e', // bright green (just tipped)
      '#16a34a', // darker green (already tipped)
    ],
  })

  // Format the total tips for display (K, M, B, T with 1 decimal)
  const formattedTotal =
    displayTotal && displayTotal !== '0'
      ? formatLargeNumber(parseFloat(displayTotal) / 100000000, 1)
      : '0'

  return (
    <View style={[a.flex_col, a.align_center, a.gap_2xs, {minWidth: 60}]}>
      <Animated.View
        style={{
          transform: [{scale: buttonScale}],
        }}>
        <Button
          label={_(msg`Tip`)}
          accessibilityHint={_(msg`Send tip to this post`)}
          variant="ghost"
          shape="round"
          color="secondary"
          hoverStyle={justTipped ? undefined : t.atoms.bg_contrast_25}
          style={[a.p_sm, a.bg_transparent]}
          onPress={onPressTip}
          disabled={!tippingWallet || isTipping || justTipped}>
          <AnimatedDollarBillIcon
            size="md"
            style={{
              color: iconColor,
            }}
          />
        </Button>
      </Animated.View>
      <Text style={[a.text_xs, t.atoms.text_contrast_medium, a.text_center]}>
        {formattedTotal}
      </Text>
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
