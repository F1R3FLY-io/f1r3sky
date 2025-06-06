import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {z} from 'zod'

import {signPayload} from '#/lib/wallet'
import {useAgent} from '#/state/session'
import {Wallet} from '../wallets'

const FIREFLY_API_URL = process.env.FIREFLY_API_URL

const WalletRequestState = z.enum(['done', 'ongoing', 'cancelled'])
export type WalletRequestState = z.infer<typeof WalletRequestState>

const UnixDate = z.coerce.number().transform(num => new Date(num * 1000))

const WalletRequest = z.object({
  id: z.string(),
  date: UnixDate,
  amount: z.coerce.bigint(),
  status: WalletRequestState,
})
export type WalletRequest = z.infer<typeof WalletRequest>

const TransferDirection = z.enum(['incoming', 'outgoing'])
export type TransferDirection = z.infer<typeof TransferDirection>

const WalletBoost = z.object({
  id: z.string(),
  direction: TransferDirection,
  date: UnixDate,
  amount: z.coerce.bigint(),
  username: z.string(),
  post: z.string(),
})
export type WalletBoost = z.infer<typeof WalletBoost>

const WalletTransfer = z.object({
  id: z.string(),
  direction: TransferDirection,
  date: UnixDate,
  amount: z.coerce.bigint(),
  to_address: z.string(),
  cost: z.coerce.bigint(),
})
export type WalletTransfer = z.infer<typeof WalletTransfer>

const WalletState = z.object({
  balance: z.coerce.bigint(),
  requests: z.array(WalletRequest),
  boosts: z.array(WalletBoost),
  transfers: z.array(WalletTransfer),
})
export type WalletState = z.infer<typeof WalletState>

export function useWalletState(address?: string) {
  const agent = useAgent()
  return useQuery({
    queryKey: ['wallet-state', address],
    queryFn: () =>
      fetch(`${FIREFLY_API_URL}/api/wallet/state/${address}`, {
        headers: new Headers({
          Authorization: `Bearer ${agent.session?.accessJwt}`,
        }),
      })
        .then(req => req.json())
        .then(json => WalletState.parse(json)),
    enabled: !!address,
  })
}

export type TransferProps = {
  amount: bigint
  toAddress: string
  description?: string
}

const byte = z.number().int().min(0).max(255)
const byteArray = z.array(byte).transform(array => new Uint8Array(array))

const TransferContract = z.object({
  contract: byteArray,
})
export type TransferContract = z.infer<typeof TransferContract>

export function useTransferMutation(wallet: Wallet) {
  const queryClient = useQueryClient()
  const agent = useAgent()
  return useMutation({
    mutationFn: async ({amount, toAddress, description}: TransferProps) => {
      const resp = await fetch(
        `${FIREFLY_API_URL}/api/wallet/transfer/prepare`,
        {
          method: 'POST',
          headers: new Headers({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${agent.session?.accessJwt}`,
          }),
          body: JSON.stringify({
            from: wallet.address,
            to: toAddress,
            amount: amount.toString(),
            description,
          }),
        },
      )

      const body = await resp.json()
      const {contract} = TransferContract.parse(body)

      const {signature, sigAlgorithm, deployer} = signPayload(
        contract,
        wallet.key,
      )

      return await fetch(`${FIREFLY_API_URL}/api/wallet/transfer/send`, {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${agent.session?.accessJwt}`,
        }),
        body: JSON.stringify({
          contract: Array.from(contract),
          sig: Array.from(signature),
          sig_algorithm: sigAlgorithm,
          deployer: Array.from(deployer),
        }),
      })
    },
    onSuccess: async (_, props) => {
      await queryClient.invalidateQueries({
        queryKey: ['wallet-state', wallet.address],
      })
      await queryClient.invalidateQueries({
        queryKey: ['wallet-state', props.toAddress],
      })
    },
  })
}
