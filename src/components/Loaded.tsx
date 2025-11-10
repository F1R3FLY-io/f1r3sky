import type React from 'react'

import {Loader} from '#/components/Loader'

export function Loaded<T>(props: {
  loaded: boolean
  context: T
  loader?: boolean
  children: (context: T) => React.ReactNode
}): React.ReactNode

export function Loaded<T>(props: {
  context?: T
  loader?: boolean
  children: (context: T) => React.ReactNode
}): React.ReactNode

export function Loaded(props: any) {
  const loaded = 'loaded' in props ? props.loaded : props.context !== undefined

  if (loaded) {
    return props.children(props.context)
  }

  return props.loader ? <Loader size="xl" /> : null
}
