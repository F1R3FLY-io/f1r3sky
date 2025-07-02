import {Text} from 'react-native'

export type WalletAddressProps = {
  value: string
}

export function WalletAddress(props: WalletAddressProps) {
  const address = props.value.slice(0, 5) + '...' + props.value.slice(-5)

  return <Text>{address}</Text>
}
