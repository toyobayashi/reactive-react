import { effectScope } from '@vue/reactivity'
import type { ReactiveEffectRunner } from '@vue/reactivity'
import { Component, PureComponent } from 'react'
import type { ReactNode, ComponentType, FunctionComponent, ComponentClass } from 'react'
import { track, untrack } from './core'
import type { ReactiveComponentContext, RenderFunction } from './types'
import { useRender } from './hooks'

/** @public */
export class ReactiveComponent<P = {}, S = {}, SS = any> extends Component<P, S, SS> implements ReactiveComponentContext {
  $$reactiveRender: ReactiveEffectRunner<ReactNode> | null = null
  $$scope = effectScope()

  constructor (props: P) {
    super(props)
    this.$$scope.run(this.onCreateReactiveData.bind(this))
  }

  /** @virtual */
  onCreateReactiveData (): void {}

  renderReactive (render: RenderFunction): ReactNode {
    return track(this, render)
  }

  componentWillUnmount (): void {
    this.$$scope.stop()
    untrack(this)
  }
}

/** @public */
export class PureReactiveComponent<P = {}, S = {}, SS = any> extends PureComponent<P, S, SS> implements ReactiveComponentContext {
  $$reactiveRender: ReactiveEffectRunner<ReactNode> | null = null
  $$scope = effectScope()

  constructor (props: P) {
    super(props)
    this.$$scope.run(this.onCreateReactiveData.bind(this))
  }

  /** @virtual */
  onCreateReactiveData (): void {}

  renderReactive (render: RenderFunction): ReactNode {
    return track(this, render)
  }

  componentWillUnmount (): void {
    this.$$scope.stop()
    untrack(this)
  }
}

/** @public */
export function makeReactive<P, T extends ComponentType<P>> (C: T): ComponentType<P> {
  if (typeof C !== 'function') {
    throw new TypeError('The first argument of makeReactive should be a React component')
  }
  if ((C as any).$$isReactive) return C
  if (typeof C.prototype.render === 'function') {
    if ((C.prototype instanceof ReactiveComponent) || (C.prototype instanceof PureReactiveComponent)) {
      return C
    }
    const Comp = C as ComponentClass<P>
    const Component = class Component extends Comp implements ReactiveComponentContext {
      $$reactiveRender: ReactiveEffectRunner<ReactNode> | null = null

      /** @override */
      render (): ReactNode {
        return track(this, () => super.render())
      }

      componentWillUnmount (): void {
        untrack(this)
        if (typeof super.componentWillUnmount === 'function') {
          super.componentWillUnmount()
        }
      }
    };
    ['propTypes', 'contextType', 'contextTypes', 'childContextTypes', 'defaultProps', 'displayName'].forEach((k) => {
      if (k in Comp) {
        (Component as any)[k] = Comp[k as 'propTypes' | 'contextType' | 'contextTypes' | 'childContextTypes' | 'defaultProps' | 'displayName']
      }
    });
    (Component as any).$$isReactive = true
    return Component
  } else {
    const render = C as FunctionComponent<P>
    const Component: FunctionComponent<P> = function (...args: [P, any?]) {
      return useRender(() => render(...args))
    };
    ['propTypes', 'contextTypes', 'defaultProps', 'displayName'].forEach((k) => {
      if (k in render) {
        (Component as any)[k] = render[k as 'propTypes' | 'contextTypes' | 'defaultProps' | 'displayName']
      }
    });
    (Component as any).$$isReactive = true
    return Component
  }
}
