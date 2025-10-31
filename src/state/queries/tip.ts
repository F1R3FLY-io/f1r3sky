import {useCallback} from 'react'
import {type AppBskyFeedDefs} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {updatePostShadow} from '#/state/cache/post-shadow'
import {type Shadow} from '#/state/cache/types'
import {useAgent, useSession} from '#/state/session'

// Tip record type - following ATProto naming conventions
export interface TipRecord {
  $type: 'app.bsky.feed.tip'
  subject: {
    uri: string
    cid: string
  }
  amount: string // Amount in smallest units (like satoshis)
  walletAddress: string
  createdAt: string
}

const TIP_COLLECTION = 'app.bsky.feed.tip'

export function useTipMutation() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uri,
      cid,
      amount,
      walletAddress,
    }: {
      uri: string
      cid: string
      amount: string
      walletAddress: string
    }) => {
      if (!currentAccount) throw new Error('Not logged in')

      const record: TipRecord = {
        $type: TIP_COLLECTION,
        subject: {
          uri,
          cid,
        },
        amount,
        walletAddress,
        createdAt: new Date().toISOString(),
      }

      const res = await agent.api.com.atproto.repo.createRecord({
        repo: currentAccount.did,
        collection: TIP_COLLECTION,
        record,
      })

      return {uri: res.uri, tipRecord: record}
    },
    onSuccess: ({tipRecord: _tipRecord}, {uri}) => {
      // Invalidate queries related to this post's tips
      queryClient.invalidateQueries({
        queryKey: ['tips', uri],
      })
    },
  })
}

export function useGetTipsQuery(postUri: string | undefined) {
  const agent = useAgent()
  const {currentAccount} = useSession()

  return useQuery({
    queryKey: ['tips', postUri, currentAccount?.did],
    queryFn: async () => {
      if (!postUri || !currentAccount) return {tips: [], totalAmount: '0'}

      try {
        // Query the user's repo for tip records for this post
        const res = await agent.api.com.atproto.repo.listRecords({
          repo: currentAccount.did,
          collection: TIP_COLLECTION,
          limit: 100,
        })

        // Filter tips for this specific post
        const tips = res.data.records.filter((record: any) => {
          return record.value.subject?.uri === postUri
        })

        // Calculate total amount
        let totalAmount = BigInt(0)
        for (const tip of tips) {
          totalAmount += BigInt((tip.value as TipRecord).amount || '0')
        }

        return {
          tips,
          totalAmount: totalAmount.toString(),
          userTipUri: tips.length > 0 ? tips[0].uri : undefined,
        }
      } catch (e) {
        console.error('Failed to fetch tips:', e)
        return {tips: [], totalAmount: '0'}
      }
    },
    enabled: !!postUri && !!currentAccount,
  })
}

// Hook to get aggregated tip count for a post (from all users)
// Note: This would ideally come from the backend/AppView
// For now, we'll just track the current user's tips
export function usePostTipCount(post: AppBskyFeedDefs.PostView) {
  const {data} = useGetTipsQuery(post.uri)
  return {
    tipCount: data?.tips.length ?? 0,
    totalAmount: data?.totalAmount ?? '0',
    userTipUri: data?.userTipUri,
  }
}

// Hook to handle tip creation with optimistic updates (similar to likes)
export function usePostTipMutation(post: Shadow<AppBskyFeedDefs.PostView>) {
  const queryClient = useQueryClient()
  const postUri = post.uri
  const postCid = post.cid
  const tipMutation = useTipMutation()

  const queueTip = useCallback(
    async (amount: string, walletAddress: string) => {
      // Get current tip data
      const currentTipCount = (post as any).tipCount ?? 0
      const currentTotalAmount = (post as any).totalTipsAmount ?? '0'

      // Calculate new totals
      const newTipCount = currentTipCount + 1
      const newTotalAmount = (
        BigInt(currentTotalAmount) + BigInt(amount)
      ).toString()

      // Optimistically update
      updatePostShadow(queryClient, postUri, {
        tipCount: newTipCount,
        totalTipsAmount: newTotalAmount,
        hasTipped: true,
      })

      try {
        // Send the tip transaction
        const result = await tipMutation.mutateAsync({
          uri: postUri,
          cid: postCid,
          amount,
          walletAddress,
        })

        // Finalize with actual data
        updatePostShadow(queryClient, postUri, {
          tipCount: newTipCount,
          totalTipsAmount: newTotalAmount,
          hasTipped: true,
        })

        return result
      } catch (error) {
        // Revert on error (including hasTipped state)
        const currentHasTipped = (post as any).hasTipped ?? false
        updatePostShadow(queryClient, postUri, {
          tipCount: currentTipCount,
          totalTipsAmount: currentTotalAmount,
          hasTipped: currentHasTipped,
        })
        throw error
      }
    },
    [queryClient, postUri, postCid, tipMutation, post],
  )

  return queueTip
}
