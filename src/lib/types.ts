import type { ReactiveEffectRunner } from '@vue/reactivity'
import type { ReactNode } from 'react'

export type ForceUpdateFunction = (callback?: () => void) => void

export interface ReactiveComponentContext {
  $$reactiveRender: ReactiveEffectRunner<ReactNode> | null
  forceUpdate: ForceUpdateFunction
}

export type RenderFunction = () => ReactNode
