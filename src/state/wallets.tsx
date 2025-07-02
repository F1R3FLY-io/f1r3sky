import React from 'react'
import {type Account, type Hex} from 'viem'

export enum WalletType {
  F1R3CAP = 'F1R3CAP',
  ETHERIUM = 'etherium',
}

export type F1r3SkyWallet = {
  privateKey: WalletPrivateKey
  tag: WalletType.F1R3CAP
}

export type WalletPrivateKey = Uint8Array | Hex

export type EtheriumWallet = {
  privateKey: WalletPrivateKey
  tag: WalletType.ETHERIUM
  account?: Account
}

export type Wallet = F1r3SkyWallet | EtheriumWallet

export type WalletsStateContext = {
  addWallet: (key: Wallet) => number
  getByIndex: (index: number) => Wallet | undefined
  getAll: () => Wallet[]
}

const wallets: Wallet[] = []

function getByIndex(index: number): Wallet | undefined {
  return wallets.at(index)
}

function addWallet(key: Wallet): number {
  return wallets.push(key) - 1
}

function getAll(): Wallet[] {
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
