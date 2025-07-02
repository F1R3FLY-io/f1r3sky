import {useMutation, useQueryClient} from '@tanstack/react-query'
import {z} from 'zod'

import {getPublicKeyFromPrivateKey, signPayload} from '#/lib/wallet'
import {useAgent} from '#/state/session'
import {type Wallet} from '../wallets'

export const FIREFLY_API_URL = process.env.FIREFLY_API_URL

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

export const WalletState = z.object({
  balance: z.coerce.bigint(),
  requests: z.array(WalletRequest),
  boosts: z.array(WalletBoost),
  transfers: z.array(WalletTransfer),
})
export type WalletState = {wallet: Wallet} & z.infer<typeof WalletState>

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
        `${FIREFLY_API_URL}/api/wallets/transfer/prepare`,
        {
          method: 'POST',
          headers: new Headers({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${agent.session?.accessJwt}`,
          }),
          body: JSON.stringify({
            from: getPublicKeyFromPrivateKey(wallet.privateKey),
            to: toAddress,
            amount: amount.toString(),
            description,
          }),
        },
      )

      const body = await resp.json()
      const {contract: payload} = TransferContract.parse(body)

      const {signature, sigAlgorithm, deployer} = signPayload(
        payload,
        wallet.privateKey,
      )

      return await fetch(`${FIREFLY_API_URL}/api/wallets/transfer/send`, {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${agent.session?.accessJwt}`,
        }),
        body: JSON.stringify({
          contract: Array.from(payload),
          sig: Array.from(signature),
          sig_algorithm: sigAlgorithm,
          deployer: Array.from(deployer),
        }),
      })
    },
    onSuccess: async (_, props) => {
      await queryClient.invalidateQueries({
        queryKey: [
          'wallet-state',
          getPublicKeyFromPrivateKey(wallet.privateKey),
        ],
      })
      await queryClient.invalidateQueries({
        queryKey: ['wallet-state', props.toAddress],
      })
    },
  })
}
