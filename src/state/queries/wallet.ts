import {type Amount, type Description} from '@f1r3fly-io/embers-client-sdk'
import {type Address} from '@f1r3fly-io/embers-client-sdk'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {type FireCAPWallet} from '../wallets'

export type TransferProps = {
  amount: Amount
  toAddress: Address
  description?: Description
}

export function useTransferMutation(wallet: FireCAPWallet) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({amount, toAddress, description}: TransferProps) =>
      wallet.embers?.wallets.sendTokens(toAddress, amount, description),
    onSuccess: async (_, props) => {
      await queryClient.invalidateQueries({
        queryKey: ['wallet-state', wallet.address.value],
      })
      await queryClient.invalidateQueries({
        queryKey: ['wallet-state', props.toAddress],
      })
    },
  })
}
