import {
  CompositeDidDocumentResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
} from '@atcute/identity-resolver'
import {
  type AppBskyActorDefs,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  type AppBskyFeedDefs,
  AppBskyFeedPost,
  AtpAgent,
  type AtUri,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query'

import {ENV} from '#/env'
import * as bsky from '#/types/bsky'

export async function truncateAndInvalidate<T = any>(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  queryClient.setQueriesData<InfiniteData<T>>({queryKey}, data => {
    if (data) {
      return {
        pageParams: data.pageParams.slice(0, 1),
        pages: data.pages.slice(0, 1),
      }
    }
    return data
  })
  return queryClient.invalidateQueries({queryKey})
}

// Given an AtUri, this function will check if the AtUri matches a
// hit regardless of whether the AtUri uses a DID or handle as a host.
//
// AtUri should be the URI that is being searched for, while currentUri
// is the URI that is being checked. currentAuthor is the author
// of the currentUri that is being checked.
export function didOrHandleUriMatches(
  atUri: AtUri,
  record: {uri: string; author: AppBskyActorDefs.ProfileViewBasic},
) {
  if (atUri.host.startsWith('did:')) {
    return atUri.href === record.uri
  }

  return atUri.host === record.author.handle && record.uri.endsWith(atUri.rkey)
}

export function getEmbeddedPost(
  v: unknown,
): AppBskyEmbedRecord.ViewRecord | undefined {
  if (
    bsky.dangerousIsType<AppBskyEmbedRecord.View>(v, AppBskyEmbedRecord.isView)
  ) {
    if (
      AppBskyEmbedRecord.isViewRecord(v.record) &&
      AppBskyFeedPost.isRecord(v.record.value)
    ) {
      return v.record
    }
  }
  if (
    bsky.dangerousIsType<AppBskyEmbedRecordWithMedia.View>(
      v,
      AppBskyEmbedRecordWithMedia.isView,
    )
  ) {
    if (
      AppBskyEmbedRecord.isViewRecord(v.record.record) &&
      AppBskyFeedPost.isRecord(v.record.record.value)
    ) {
      return v.record.record
    }
  }
}

export function embedViewRecordToPostView(
  v: AppBskyEmbedRecord.ViewRecord,
): AppBskyFeedDefs.PostView {
  return {
    uri: v.uri,
    cid: v.cid,
    author: v.author,
    record: v.value,
    indexedAt: v.indexedAt,
    labels: v.labels,
    embed: v.embeds?.[0],
    likeCount: v.likeCount,
    quoteCount: v.quoteCount,
    replyCount: v.replyCount,
    repostCount: v.repostCount,
  }
}

const DID_RESOLVER = new CompositeDidDocumentResolver({
  methods: {
    plc: new PlcDidDocumentResolver(
      ENV !== 'production'
        ? {
            apiUrl: 'http://localhost:2582',
          }
        : undefined,
    ),
    web: new WebDidDocumentResolver(),
  },
})

export async function resolveDidPds(did: string) {
  const document = await DID_RESOLVER.resolve(did as any)
  const service = document.service?.find(
    service => service.id === '#atproto_pds',
  )?.serviceEndpoint
  return new AtpAgent({service: service as string})
}
