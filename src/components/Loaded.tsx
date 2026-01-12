import type React from 'react'

type LoadedProps<T> = {
  loaded: boolean
  context?: T
  children: (context: T) => React.ReactNode
}

export function Loaded<T>({loaded, children, context}: LoadedProps<T>) {
  return loaded ? children(context!) : null
}
