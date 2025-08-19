import {base64} from '@scure/base'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {
  createTestClient,
  type Hex,
  http,
  publicActions,
  walletActions,
} from 'viem'
import {privateKeyToAccount} from 'viem/accounts'
import {hardhat} from 'viem/chains'
import {z} from 'zod'

import {signPayload} from '#/lib/wallet'
import {type EthereumWallet, type FireCAPWallet, WalletType} from '../wallets'

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
export type WalletState = z.infer<typeof WalletState>

export type TransferProps = {
  amount: bigint
  toAddress: string
  description?: string
}

const TransferContract = z.object({
  contract: z.string(),
})
export type TransferContract = z.infer<typeof TransferContract>

export function useTransferMutation(wallet: FireCAPWallet | EthereumWallet) {
  const queryClient = useQueryClient()

  async function sendByF1r3Cap(
    wallet: FireCAPWallet,
    {amount, toAddress, description}: TransferProps,
  ) {
    const resp = await fetch(
      `${FIREFLY_API_URL}/api/wallets/transfer/prepare`,
      {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
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
    const contractBytes = base64.decode(contract)

    const {signature, sigAlgorithm, deployer} = signPayload(
      contractBytes,
      wallet.privateKey,
    )

    return await fetch(`${FIREFLY_API_URL}/api/wallets/transfer/send`, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        contract,
        sig: base64.encode(signature),
        sig_algorithm: sigAlgorithm,
        deployer: base64.encode(deployer),
      }),
    })
  }

  async function sendByEther(
    wallet: EthereumWallet,
    {amount, toAddress}: TransferProps,
  ) {
    const account = privateKeyToAccount(wallet.privateKey)

    const publicClient = createTestClient({
      account,
      chain: hardhat,
      mode: 'hardhat',
      transport: http(),
    })
      .extend(publicActions)
      .extend(walletActions)

    await publicClient.sendTransaction({
      to: toAddress as Hex,
      value: amount,
    })
  }

  return useMutation({
    mutationFn: async (props: TransferProps) => {
      switch (wallet.walletType) {
        case WalletType.ETHEREUM:
          return sendByEther(wallet, props)
        case WalletType.F1R3CAP:
          return sendByF1r3Cap(wallet, props)
      }
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
