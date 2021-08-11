import { effect, stop } from '@vue/reactivity'
import type { ReactiveComponentContext, RenderFunction } from './types'

/** @public */
export function untrack (context: ReactiveComponentContext): void {
  if (context.$$reactiveRender) {
    stop(context.$$reactiveRender)
    context.$$reactiveRender = null
  }
}

/** @public */
export function track (context: ReactiveComponentContext, renderFunction: RenderFunction): ReturnType<RenderFunction> {
  untrack(context)
  context.$$reactiveRender = effect(renderFunction, {
    lazy: true,
    scheduler () {
      context.forceUpdate()
    }
  })

  return context.$$reactiveRender()
}
