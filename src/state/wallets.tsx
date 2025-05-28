import React from 'react'

export type Wallet = {
  key: Uint8Array
  address: string
  hash: number
}

export type WalletsStateContext = {
  wallets: Wallet[]
  addWallet: (key: Wallet) => void
}

const WalletsContext = React.createContext<WalletsStateContext>({
  wallets: [],
  addWallet: () => {},
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, dispatch] = React.useReducer(
    (state: Wallet[], newWallet: Wallet) => [...state, newWallet],
    [],
  )

  return (
    <WalletsContext.Provider value={{wallets: state, addWallet: dispatch}}>
      {children}
    </WalletsContext.Provider>
  )
}

export function useWallets() {
  return React.useContext(WalletsContext)
}
