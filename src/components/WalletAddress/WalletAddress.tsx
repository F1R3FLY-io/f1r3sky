export type WalletAddressProps = {
  value: string
}

export function WalletAddress(props: WalletAddressProps) {
  const address = props.value.slice(0, 10) + '...' + props.value.slice(-5)

  return <>{address}</>
}
