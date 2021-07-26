import { effect, stop } from '@vue/reactivity'
import type { ReactiveComponentContext, RenderFunction } from './types'

export function cleanup (context: ReactiveComponentContext): void {
  if (context.$$reactiveRender) {
    stop(context.$$reactiveRender)
    context.$$reactiveRender = null
  }
}

export function trackRender (context: ReactiveComponentContext, renderFunction: RenderFunction): ReturnType<RenderFunction> {
  cleanup(context)
  context.$$reactiveRender = effect(renderFunction, {
    lazy: true,
    scheduler () {
      context.forceUpdate()
    }
  })

  return context.$$reactiveRender()
}
