import { effect, stop } from '@vue/reactivity'
import type { ForceUpdateFunction, ReactiveComponentContext, RenderFunction } from './types'

export function cleanup (context: ReactiveComponentContext): void {
  if (context.$$runner) {
    stop(context.$$runner)
    context.$$runner = null
  }
}

export function trackRender (context: ReactiveComponentContext, renderFunction: RenderFunction, forceUpdate: ForceUpdateFunction): ReturnType<RenderFunction> {
  cleanup(context)
  context.$$runner = effect(renderFunction, {
    lazy: true,
    scheduler () {
      forceUpdate()
    }
  })

  return context.$$runner()
}
