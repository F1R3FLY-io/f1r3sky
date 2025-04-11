import {useQuery} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

export type WalletRequestState = 'done' | 'ongoing' | 'cancelled'

export type WalletRequest = {
  id: string
  date: Date
  amount: number
  status: WalletRequestState
}

export type TransferDirection = 'incoming' | 'outgoing'

export type WalletBoost = {
  id: string
  direction: TransferDirection
  date: Date
  amount: number
  username: string
  post: string
}

export type WalletTransfer = {
  id: string
  direction: TransferDirection
  date: Date
  amount: number
  to_address: string
}

export type WalletState = {
  address: string
  balance: number
  requests: WalletRequest[]
  boosts: WalletBoost[]
  transfers: WalletTransfer[]
}

export default function () {
  const agent = useAgent()
  return useQuery({
    queryKey: ['wallet-state'],
    queryFn: () =>
      fetch(`${agent.serviceUrl.origin}/api/wallet/state`, {
        headers: new Headers({
          Authorization: `Bearer ${agent.session?.accessJwt}`,
        }),
      })
        .then(req => req.json())
        .then(
          (json): WalletState => ({
            address: json.address,
            balance: json.balance,
            requests: json.requests.map(
              (item: any): WalletRequest => ({
                id: item.id,
                date: new Date(item.date),
                amount: item.amount,
                status: item.status,
              }),
            ),
            boosts: json.boosts.map(
              (item: any): WalletBoost => ({
                id: item.id,
                direction: item.direction,
                date: new Date(item.date),
                amount: item.amount,
                username: item.username,
                post: item.post,
              }),
            ),
            transfers: json.transfers.map(
              (item: any): WalletTransfer => ({
                id: item.id,
                direction: item.direction,
                date: new Date(item.date),
                amount: item.amount,
                to_address: item.to_address,
              }),
            ),
          }),
        ),
  })
}
