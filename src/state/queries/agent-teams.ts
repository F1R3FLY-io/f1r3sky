import {type BskyAgent} from '@atproto/api'
import {Amount, Uri} from '@f1r3fly-io/embers-client-sdk'
import {useMutation, useQuery} from '@tanstack/react-query'

import {useAgent} from '#/state/session'
import {type UniWallet} from '#/state/wallets.tsx'
import {type ThreadDraft} from '#/view/com/composer/state/composer.ts'

type BotConfigRecord = {
  $type: 'com.f1r3sky.bot.config'
  uri: string
}

const BOT_CONFIG_COLLECTION: BotConfigRecord['$type'] = 'com.f1r3sky.bot.config'
const BOT_CONFIG_RKEY = 'self'

export function useBotConfigQuery(did?: string) {
  const agent = useAgent()

  return useQuery({
    enabled: !!did,
    queryKey: [BOT_CONFIG_COLLECTION, did],
    queryFn: async () => {
      try {
        const res = await agent.com.atproto.repo.getRecord({
          repo: did!,
          collection: BOT_CONFIG_COLLECTION,
          rkey: BOT_CONFIG_RKEY,
        })

        return res.data.value as BotConfigRecord
      } catch {
        return null
      }
    },
  })
}

export function useCheckIsBotMutation() {
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({did}: {did: string}) => {
      try {
        await agent.com.atproto.repo.getRecord({
          repo: did,
          collection: BOT_CONFIG_COLLECTION,
          rkey: BOT_CONFIG_RKEY,
        })
        return {did, isBot: true}
      } catch {
        return {did, isBot: false}
      }
    },
  })
}

export function extractMentionedDids(thread: ThreadDraft): string[] {
  const dids = new Set<string>()

  for (const post of thread.posts) {
    for (const facet of post.richtext.facets ?? []) {
      console.log(facet.features)
      for (const feature of facet.features ?? []) {
        if (feature.$type === 'app.bsky.richtext.facet#mention') {
          dids.add(feature?.did)
        }
      }
    }
  }

  return [...dids]
}

async function getBotAgentTeamUri(
  agent: BskyAgent,
  did: string,
): Promise<Uri | null> {
  try {
    const res = await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: 'com.f1r3sky.bot.config',
      rkey: 'self',
    })

    const record = res.data.value as BotConfigRecord
    return Uri.tryFrom(record?.uri) ?? null
  } catch {
    return null
  }
}

function removeMentionFacets(text: string, facets?: any[]): string {
  if (!facets?.length) return text

  // Collect byte ranges of mention facets
  const ranges: Array<{start: number; end: number}> = []
  for (const facet of facets) {
    for (const f of facet.features ?? []) {
      if (f.$type === 'app.bsky.richtext.facet#mention') {
        ranges.push({start: facet.index.byteStart, end: facet.index.byteEnd})
      }
    }
  }
  if (!ranges.length) return text

  // Merge overlapping ranges
  ranges.sort((a, b) => a.start - b.start)
  const merged: typeof ranges = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (!last || r.start > last.end) merged.push({...r})
    else last.end = Math.max(last.end, r.end)
  }

  // Remove from UTF-8 bytes
  const enc = new TextEncoder()
  const dec = new TextDecoder()
  const bytes = enc.encode(text)

  const out: number[] = []
  let cursor = 0
  for (const r of merged) {
    out.push(...bytes.slice(cursor, r.start))
    cursor = r.end
  }
  out.push(...bytes.slice(cursor))

  // Normalize whitespace (mentions removal can leave double spaces)
  return dec
    .decode(new Uint8Array(out))
    .replace(/\s{2,}/g, ' ')
    .trim()
}
function buildPromptFromThread(thread: ThreadDraft): string {
  const p0 = thread.posts[0]
  return removeMentionFacets(p0.richtext.text, p0.richtext.facets)
}

type PostRef = {uri: string; cid: string}
type FireskyReply = {parent: PostRef; root: PostRef}

function buildReplyToFromAppViewThread(
  appViewThreadItems: any[],
): FireskyReply | null {
  const first = appViewThreadItems?.[0]
  const post = first?.value?.post
  if (!post?.uri || !post?.cid) return null

  const ref: PostRef = {uri: post.uri, cid: post.cid}
  return {parent: ref, root: ref}
}

export async function sendBotInfo(
  agent: BskyAgent,
  wallet: UniWallet,
  thread: ThreadDraft,
  postUri: string,
  appViewThreadItems: any[] | undefined,
): Promise<boolean> {
  const mentionedDids = extractMentionedDids(thread)
  const embers = wallet.embers

  if (!mentionedDids.length) return false

  const prompt = buildPromptFromThread(thread)
  if (!prompt) return false

  const replyTo = buildReplyToFromAppViewThread(appViewThreadItems ?? [])

  for (const did of mentionedDids) {
    const agentTeamUri = await getBotAgentTeamUri(agent, did)
    if (!agentTeamUri) continue
    const phloLimit = Amount.tryFrom(50_000_000n)

    await embers.agentsTeams.runOnFiresky(
      agentTeamUri,
      prompt,
      phloLimit,
      replyTo ?? undefined,
    )

    console.log('Would run bot on Firesky:', {
      did,
      agentTeamUri,
      prompt,
      replyTo,
      postUri,
    })
    return true
  }

  return false
}
