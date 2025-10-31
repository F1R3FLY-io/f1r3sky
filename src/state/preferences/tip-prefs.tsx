import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['tipPrefs']

type ApiContext = {
  setDefaultTipAmount: (amount: string) => void
  setDefaultTippingWalletIndex: (index: number) => void
}

const stateContext = React.createContext<StateContext>(
  persisted.defaults.tipPrefs,
)

const apiContext = React.createContext<ApiContext>({
  setDefaultTipAmount: (_: string) => {},
  setDefaultTippingWalletIndex: (_: number) => {},
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('tipPrefs'))

  const setStateWrapped = React.useCallback(
    (
      fn: (prev: persisted.Schema['tipPrefs']) => persisted.Schema['tipPrefs'],
    ) => {
      const s = fn(persisted.get('tipPrefs'))
      setState(s)
      persisted.write('tipPrefs', s)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('tipPrefs', nextTipPrefs => {
      setState(nextTipPrefs)
    })
  }, [setStateWrapped])

  const api = React.useMemo(
    () => ({
      setDefaultTipAmount(amount: string) {
        setStateWrapped(prev => ({
          ...prev,
          defaultTipAmount: amount,
        }))
      },
      setDefaultTippingWalletIndex(index: number) {
        setStateWrapped(prev => ({
          ...prev,
          defaultTippingWalletIndex: index,
        }))
      },
    }),
    [setStateWrapped],
  )

  return (
    <stateContext.Provider value={state}>
      <apiContext.Provider value={api}>{children}</apiContext.Provider>
    </stateContext.Provider>
  )
}

export function useTipPrefs() {
  return React.useContext(stateContext)
}

export function useTipPrefsApi() {
  return React.useContext(apiContext)
}
