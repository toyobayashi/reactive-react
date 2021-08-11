import type { ReactiveEffectRunner } from '@vue/reactivity'
import type { ReactNode } from 'react'

/** @public */
export type ForceUpdateFunction = (callback?: () => void) => void

/** @public */
export interface ReactiveComponentContext {
  $$reactiveRender: ReactiveEffectRunner<ReactNode> | null
  forceUpdate: ForceUpdateFunction
}

/** @public */
export type RenderFunction = () => ReactNode
