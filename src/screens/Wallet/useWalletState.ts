import {useQuery} from '@tanstack/react-query'
import {z} from 'zod'

import {useAgent} from '#/state/session'

const WalletRequestState = z.enum(['done', 'ongoing', 'cancelled'])
export type WalletRequestState = z.infer<typeof WalletRequestState>

const WalletRequest = z.object({
  id: z.string(),
  date: z.coerce.date(),
  amount: z.number(),
  status: WalletRequestState,
})
export type WalletRequest = z.infer<typeof WalletRequest>

const TransferDirection = z.enum(['incoming', 'outgoing'])
export type TransferDirection = z.infer<typeof TransferDirection>

const WalletBoost = z.object({
  id: z.string(),
  direction: TransferDirection,
  date: z.coerce.date(),
  amount: z.number(),
  username: z.string(),
  post: z.string(),
})
export type WalletBoost = z.infer<typeof WalletBoost>

const WalletTransfer = z.object({
  id: z.string(),
  direction: TransferDirection,
  date: z.coerce.date(),
  amount: z.number(),
  to_address: z.string(),
})
export type WalletTransfer = z.infer<typeof WalletTransfer>

const WalletState = z.object({
  address: z.string(),
  balance: z.number(),
  requests: z.array(WalletRequest),
  boosts: z.array(WalletBoost),
  transfers: z.array(WalletTransfer),
})
export type WalletState = z.infer<typeof WalletState>

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
        .then(json => WalletState.parse(json)),
  })
}
