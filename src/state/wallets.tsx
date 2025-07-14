import React from 'react'
import {type Hex} from 'viem'

export enum WalletType {
  F1R3CAP = 'F1R3CAP',
  ETHEREUM = 'ethereum',
}

export type WalletKey = Uint8Array | Hex

export type FireCAPWallet = {
  privateKey: Uint8Array
  publicKey: Uint8Array
  address: string
  walletType: WalletType.F1R3CAP
}

export type EthereumWallet = {
  privateKey: Hex
  publicKey: Hex
  address: Hex
  walletType: WalletType.ETHEREUM
}

export type UniWallet = FireCAPWallet | EthereumWallet

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
    const newWallets = [...wallets, wallet]
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
