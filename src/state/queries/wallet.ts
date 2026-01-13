import {type Amount} from '@f1r3fly-io/embers-client-sdk'
import {Address} from '@f1r3fly-io/embers-client-sdk'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {useAgent, useSession} from '#/state/session'
import {type UniWallet} from '../wallets'
import {resolveDidPds} from './util'

export function useWalletState(wallet?: UniWallet) {
  return useQuery({
    enabled: !!wallet,
    queryKey: ['wallet-state', wallet?.address.value],
    queryFn: async () => wallet!.embers.wallets.getState(),
  })
}

export type TransferProps = {
  amount: Amount
  toAddress: Address
  description?: string
}

export function useTransferMutation(wallet: UniWallet) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({amount, toAddress, description}: TransferProps) =>
      wallet.embers.wallets
        .transfer(toAddress, amount, description)
        .then(({waitForFinalization}) => waitForFinalization)
        .then(async () => {
          await queryClient.invalidateQueries({
            queryKey: ['wallet-state', wallet.address.value],
          })
          await queryClient.invalidateQueries({
            queryKey: ['wallet-state', toAddress.value],
          })
        }),
  })
}

export type BoostProps = {
  amount: Amount
  toAddress: Address
  postAuthorDid: string
  description?: string
  postId?: string
}

export function useBoostMutation(wallet: UniWallet) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      amount,
      toAddress,
      postAuthorDid,
      description,
      postId,
    }: BoostProps) =>
      wallet.embers.wallets
        .boost(toAddress, amount, postAuthorDid, description, postId)
        .then(({waitForFinalization}) => waitForFinalization)
        .then(async () => {
          await queryClient.invalidateQueries({
            queryKey: ['wallet-state', wallet.address.value],
          })
          await queryClient.invalidateQueries({
            queryKey: ['wallet-state', toAddress.value],
          })
        }),
  })
}

type BoostRecord = {
  $type: 'com.f1r3sky.user.boost'
  walletAddress: string
  message?: string
  createdAt: string
}

const BOOST_COLLECTION: BoostRecord['$type'] = 'com.f1r3sky.user.boost'

export type BoostConfig = {
  walletAddress: Address
  message: string
}

export function useUserBoostQuery(did?: string) {
  return useQuery({
    enabled: !!did,
    queryKey: [BOOST_COLLECTION, did],
    queryFn: async () => {
      const agent = await resolveDidPds(did!)
      const res = await agent.com.atproto.repo.getRecord({
        repo: did!,
        collection: BOOST_COLLECTION,
        rkey: 'self',
      })

      const record = res.data.value as BoostRecord

      return {...record, walletAddress: Address.tryFrom(record.walletAddress)}
    },
  })
}

export function useEditUserBoostMutation() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      walletAddress,
      message,
    }: {
      walletAddress: Address
      message?: string
    }) => {
      if (!currentAccount) throw new Error('Not logged in')

      const record: BoostRecord = {
        $type: BOOST_COLLECTION,
        walletAddress: walletAddress.value,
        message,
        createdAt: new Date().toISOString(),
      }

      await agent.com.atproto.repo.putRecord({
        repo: currentAccount.did,
        collection: BOOST_COLLECTION,
        rkey: 'self',
        record,
      })

      return record
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [BOOST_COLLECTION, currentAccount!.did],
      })
    },
  })
}

export function useDeleteUserBoostMutation() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!currentAccount) throw new Error('Not logged in')

      return agent.com.atproto.repo.deleteRecord({
        repo: currentAccount.did,
        collection: BOOST_COLLECTION,
        rkey: 'self',
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [BOOST_COLLECTION, currentAccount!.did],
      })
    },
  })
}
