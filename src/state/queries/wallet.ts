import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {z} from 'zod'

import {useAgent} from '#/state/session'

const WalletRequestState = z.enum(['done', 'ongoing', 'cancelled'])
export type WalletRequestState = z.infer<typeof WalletRequestState>

const WalletRequest = z.object({
  id: z.string(),
  date: z.coerce.date(),
  amount: z.coerce.bigint(),
  status: WalletRequestState,
})
export type WalletRequest = z.infer<typeof WalletRequest>

const TransferDirection = z.enum(['incoming', 'outgoing'])
export type TransferDirection = z.infer<typeof TransferDirection>

const WalletBoost = z.object({
  id: z.string(),
  direction: TransferDirection,
  date: z.coerce.date(),
  amount: z.coerce.bigint(),
  username: z.string(),
  post: z.string(),
})
export type WalletBoost = z.infer<typeof WalletBoost>

const WalletTransfer = z.object({
  id: z.string(),
  direction: TransferDirection,
  date: z.coerce.date(),
  amount: z.coerce.bigint(),
  to_address: z.string(),
})
export type WalletTransfer = z.infer<typeof WalletTransfer>

const WalletState = z.object({
  address: z.string(),
  balance: z.coerce.bigint(),
  requests: z.array(WalletRequest),
  boosts: z.array(WalletBoost),
  transfers: z.array(WalletTransfer),
})
export type WalletState = z.infer<typeof WalletState>

export function useWalletState() {
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

export type TransferProps = {
  amount: bigint
  to_address: string
  description?: string
}

function replacer(_: any, value: any) {
  return typeof value === 'bigint' ? value.toString() : value
}

export function useTransferMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()
  return useMutation({
    mutationFn: (props: TransferProps) =>
      fetch(`${agent.serviceUrl.origin}/api/wallet/transfer`, {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${agent.session?.accessJwt}`,
        }),
        body: JSON.stringify(props, replacer),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: ['wallet-state']}),
  })
}
