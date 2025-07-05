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

const wallets: UniWallet[] = []

function getByIndex(index: number): UniWallet | undefined {
  return wallets.at(index)
}

function addWallet(key: UniWallet): number {
  return wallets.push(key) - 1
}

function getAll(): UniWallet[] {
  return [...wallets]
}

const WalletsContext = React.createContext<WalletsStateContext>({
  addWallet,
  getByIndex,
  getAll,
})

export function Provider({children}: React.PropsWithChildren<{}>) {
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
