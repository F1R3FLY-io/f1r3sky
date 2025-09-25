import React from 'react'
import {
  type Address,
  AgentsApiSdk,
  AgentsTeamsApiSdk,
  type PrivateKey,
  type PublicKey,
  TestnetApiSdk,
  WalletsApiSdk,
} from '@f1r3fly-io/embers-client-sdk'
import {type Hex} from 'viem'

export enum WalletType {
  F1R3CAP = 'F1R3CAP',
  ETHEREUM = 'ethereum',
}

export type WalletKey = Uint8Array | Hex

export type FireCAPWallet = {
  privateKey: PrivateKey
  publicKey: PublicKey
  address: Address
  walletType: WalletType.F1R3CAP
  embers?: EmbersAPI | undefined
}

export type UniWallet = FireCAPWallet

export type EmbersAPI = {
  agents: AgentsApiSdk
  agentsTeams: AgentsTeamsApiSdk
  testnet: TestnetApiSdk
  wallets: WalletsApiSdk
}

export type WalletsStateContext = {
  addWallet: (key: UniWallet) => number
  getByIndex: (index: number) => UniWallet | undefined
  readonly wallets: UniWallet[]
}
const FIREFLY_API_URL =
  process.env.EXPO_PUBLIC_EMBERS_API_URL ?? 'http://[::1]:8080'

const WalletsContext = React.createContext<WalletsStateContext>({
  addWallet: (_: UniWallet) => 0,
  getByIndex: () => undefined,
  wallets: [],
})

export function createEmbersAPI(privateKey: PrivateKey): EmbersAPI {
  return {
    agents: new AgentsApiSdk({
      basePath: FIREFLY_API_URL,
      privateKey,
    }),
    agentsTeams: new AgentsTeamsApiSdk({
      basePath: FIREFLY_API_URL,
      privateKey,
    }),
    testnet: new TestnetApiSdk({
      basePath: FIREFLY_API_URL,
      privateKey,
    }),
    wallets: new WalletsApiSdk({
      basePath: FIREFLY_API_URL,
      privateKey,
    }),
  }
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [wallets, setWallets] = React.useState<UniWallet[]>([])

  function getByIndex(index: number): UniWallet | undefined {
    return wallets.at(index - 1)
  }

  function addWallet(wallet: UniWallet): number {
    if (wallet.walletType === WalletType.F1R3CAP) {
      const walletWithEmbers: FireCAPWallet = {
        ...wallet,
        embers: createEmbersAPI(wallet.privateKey),
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
