import type { ReactiveEffect } from '@vue/reactivity'
import type { ReactNode } from 'react'

export type ForceUpdateFunction = (callback?: () => void) => void

export interface ReactiveComponentContext {
  $$reactiveRender: ReactiveEffect<ReactNode> | null
  forceUpdate: ForceUpdateFunction
}

export type RenderFunction = () => ReactNode
