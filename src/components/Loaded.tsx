import type React from 'react'

type LoadedProps<T> = {
  context?: T
  children: (context: T) => React.ReactNode
}

export function Loaded<T>({children, context}: LoadedProps<T>) {
  return context ? children(context) : null
}
