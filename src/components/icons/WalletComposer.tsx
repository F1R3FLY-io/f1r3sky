import React from 'react'
import Svg, {Path} from 'react-native-svg'

import {type Props, useCommonSVGProps} from '#/components/icons/common'

export const WalletComposer_Stroke2_Corner0_Rounded = React.forwardRef<
  Svg,
  Props
>(function WalletComposerImpl(props, ref) {
  const {fill, size, style, ...rest} = useCommonSVGProps(props)

  return (
    <Svg
      fill="none"
      {...rest}
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={[style]}>
      <Path
        d="M19.357 7.125H4.357C3.15193 7.125 2.17857 8.09835 2.17857 9.30342V17.9463C2.17857 19.1513 3.15193 20.1247 4.357 20.1247H19.357C20.5621 20.1247 21.5354 19.1513 21.5354 17.9463V9.30342C21.5354 8.09835 20.5621 7.125 19.357 7.125Z"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Path
        d="M19.1396 7.12424V5.71771C19.1395 5.37308 19.063 5.03246 18.9155 4.7204C18.768 4.40834 18.553 4.13273 18.2839 3.91276C18.0148 3.69278 17.6986 3.53407 17.3574 3.44867C17.0162 3.36327 16.6587 3.35341 16.3143 3.41996L4.01207 5.52346C3.47596 5.62562 2.99234 5.91739 2.64456 6.34655C2.29678 6.7757 2.1069 7.31591 2.10714 7.87451V10.1242"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Path
        d="M17.1072 15.362C16.8131 15.362 16.5256 15.2745 16.2814 15.1111C16.0373 14.9478 15.8475 14.7156 15.7338 14.4439C15.6202 14.1722 15.5876 13.8735 15.6398 13.5849C15.692 13.2964 15.8265 13.0317 16.0274 12.8237C16.2282 12.6157 16.4867 12.4736 16.7695 12.4144C17.0524 12.3552 17.3475 12.3813 17.6168 12.4895C17.8861 12.5977 18.1184 12.7832 18.2854 13.0234C18.4525 13.2637 18.5465 13.5482 18.5465 13.8393C18.5465 14.2265 18.3944 14.5979 18.1244 14.8749C17.8543 15.1519 17.4888 15.312 17.1072 15.362Z"
        fill={fill}
        stroke={fill}
        strokeWidth="0.03125"
      />
    </Svg>
  )
})

export const WalletComposer = WalletComposer_Stroke2_Corner0_Rounded
