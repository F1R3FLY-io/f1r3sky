import React from 'react'
import {
  type Address,
  EmbersApiSdk,
  type PrivateKey,
  type PublicKey,
} from '@f1r3fly-io/embers-client-sdk'

export type UniWallet = {
  privateKey: PrivateKey
  publicKey: PublicKey
  address: Address
  embers: EmbersApiSdk
}

export type WalletsStateContext = {
  addWallet: (key: PrivateKey) => number
  getByIndex: (index: number) => UniWallet | undefined
  readonly wallets: UniWallet[]
}

const WalletsContext = React.createContext<WalletsStateContext>({
  addWallet: (_: PrivateKey) => 0,
  getByIndex: () => undefined,
  wallets: [],
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [wallets, setWallets] = React.useState<UniWallet[]>([])

  const getByIndex = (index: number) => wallets.at(index - 1)

  const addWallet = (privateKey: PrivateKey) => {
    const publicKey = privateKey.getPublicKey()
    const address = publicKey.getAddress()

    const walletWithEmbers = {
      privateKey,
      publicKey,
      address,
      embers: new EmbersApiSdk({
        basePath: process.env.EXPO_PUBLIC_EMBERS_API_URL,
        privateKey,
      }),
    }

    const newWallets = [...wallets, walletWithEmbers]
    setWallets(newWallets)
    return newWallets.length
  }

  return (
    <WalletsContext.Provider
      value={{
        addWallet,
        getByIndex,
        wallets,
      }}>
      {children}
    </WalletsContext.Provider>
  )
}

export function useWallets() {
  return React.useContext(WalletsContext)
}
