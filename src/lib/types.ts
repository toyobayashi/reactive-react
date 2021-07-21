import type { ReactiveEffect } from '@vue/reactivity'
import type { ReactNode } from 'react'

export interface ReactiveComponentContext {
  $$runner: ReactiveEffect<ReactNode> | null
}

export type RenderFunction = () => ReactNode

export type ForceUpdateFunction = () => void
