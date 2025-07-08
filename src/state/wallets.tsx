import React from 'react'
import {type Hex} from 'viem'

export enum WalletType {
  F1R3CAP = 'F1R3CAP',
  ETHERIUM = 'etherium',
}

export type WalletKey = Uint8Array | Hex

export type FireCAPWallet = {
  privateKey: Uint8Array
  publicKey: Uint8Array
  address: string
  walletType: WalletType.F1R3CAP
}

export type EtheriumWallet = {
  privateKey: Hex
  publicKey: Hex
  address: Hex
  walletType: WalletType.ETHERIUM
}

export type UniWallet = FireCAPWallet | EtheriumWallet

export type WalletsStateContext = {
  addWallet: (key: UniWallet) => number
  getByIndex: (index: number) => UniWallet | undefined
  getAll: () => UniWallet[]
}

const WalletsContext = React.createContext<WalletsStateContext>({
  addWallet: (_key: UniWallet) => 0,
  getByIndex: () => undefined,
  getAll: () => [],
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [wallets, setWallets] = React.useState<UniWallet[]>([])

  function getByIndex(index: number): UniWallet | undefined {
    return wallets.at(index - 1)
  }

  function addWallet(key: UniWallet): number {
    const newWallets = [...wallets, key]
    setWallets(newWallets)
    return newWallets.length - 1
  }

  function getAll(): UniWallet[] {
    return wallets
  }

  return (
    <WalletsContext.Provider
      value={{
        addWallet,
        getByIndex,
        getAll,
      }}>
      {children}
    </WalletsContext.Provider>
  )
}

export function useWallets() {
  return React.useContext(WalletsContext)
}
