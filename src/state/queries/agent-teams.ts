import {type BskyAgent} from '@atproto/api'
import {Amount, type FireskyReply, Uri} from '@f1r3fly-io/embers-client-sdk'
import {useQuery} from '@tanstack/react-query'

import {useAgent} from '#/state/session'
import {type UniWallet} from '#/state/wallets.tsx'
import {type PostDraft} from '#/view/com/composer/state/composer.ts'

type AgentsTeamConfig = {
  $type: 'com.f1r3sky.agentsteam.config'
  uri: string
}

const AGENTS_TEAM_CONFIG_COLLECTION: AgentsTeamConfig['$type'] =
  'com.f1r3sky.agentsteam.config'

export function useBotConfigQuery(did?: string) {
  const agent = useAgent()

  return useQuery({
    enabled: !!did,
    queryKey: [AGENTS_TEAM_CONFIG_COLLECTION, did],
    queryFn: async () => {
      try {
        const res = await agent.com.atproto.repo.getRecord({
          repo: did!,
          collection: AGENTS_TEAM_CONFIG_COLLECTION,
          rkey: 'self',
        })

        return res.data.value as AgentsTeamConfig
      } catch {
        return null
      }
    },
  })
}

function extractMentionedDids(post: PostDraft): string[] {
  const dids = new Set<string>()

  for (const facet of post.richtext.facets ?? []) {
    for (const feature of facet.features ?? []) {
      if (feature.$type === 'app.bsky.richtext.facet#mention') {
        dids.add((feature as any).did)
      }
    }
  }

  return [...dids]
}

async function getAgentsTeamUri(
  agent: BskyAgent,
  did: string,
): Promise<Uri | null> {
  try {
    const res = await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: AGENTS_TEAM_CONFIG_COLLECTION,
      rkey: 'self',
    })

    const record = res.data.value as AgentsTeamConfig
    return Uri.tryFrom(record.uri)
  } catch {
    return null
  }
}

function buildPromptFromPost(post: PostDraft): string {
  while (true) {
    const facet = post.richtext.facets?.find(facet =>
      facet.features.find(
        feature => feature.$type === 'app.bsky.richtext.facet#mention',
      ),
    )

    if (!facet) {
      return post.richtext.text
    }

    post.richtext.delete(facet.index.byteStart, facet.index.byteEnd)
  }
}

export async function runAgentsTeam(
  agent: BskyAgent,
  wallet: UniWallet,
  post: PostDraft,
  replyTo: FireskyReply,
): Promise<boolean> {
  const mentionedDids = extractMentionedDids(post)
  if (!mentionedDids.length) return false

  const prompt = buildPromptFromPost(post)
  if (!prompt) return false

  for (const did of mentionedDids) {
    const agentTeamUri = await getAgentsTeamUri(agent, did)
    if (!agentTeamUri) continue

    const phloLimit = Amount.tryFrom(50_000_000n)
    await wallet.embers.agentsTeams.runOnFiresky(
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
    })
    return true
  }

  return false
}
