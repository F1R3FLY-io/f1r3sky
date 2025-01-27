import React from 'react'
import {
  type Address,
  EmbersApiSdk,
  type PrivateKey,
  type PublicKey,
} from '@f1r3fly-io/embers-client-sdk'

export enum WalletType {
  F1R3CAP = 'F1R3CAP',
}

export type FireCAPWallet = {
  privateKey: PrivateKey
  publicKey: PublicKey
  address: Address
  walletType: WalletType.F1R3CAP
  embers?: EmbersApiSdk | undefined
}

export type UniWallet = FireCAPWallet

export type WalletsStateContext = {
  addWallet: (key: UniWallet) => number
  getByIndex: (index: number) => UniWallet | undefined
  readonly wallets: UniWallet[]
}

const WalletsContext = React.createContext<WalletsStateContext>({
  addWallet: (_: UniWallet) => 0,
  getByIndex: () => undefined,
  wallets: [],
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [wallets, setWallets] = React.useState<UniWallet[]>([])

  function getByIndex(index: number): UniWallet | undefined {
    return wallets.at(index - 1)
  }

  function addWallet(wallet: UniWallet): number {
    if (wallet.walletType === WalletType.F1R3CAP) {
      const walletWithEmbers: FireCAPWallet = {
        ...wallet,
        embers: new EmbersApiSdk({
          basePath: process.env.EXPO_PUBLIC_EMBERS_API_URL,
          privateKey: wallet.privateKey,
        }),
      }

      const newWallets = [...wallets, walletWithEmbers]
      setWallets(newWallets)
      return newWallets.length
    } else {
      const newWallets = [...wallets, wallet]
      setWallets(newWallets)
      return newWallets.length
    }
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
