import { effectScope, isRef } from '@vue/reactivity'
import type { ReactiveEffectRunner } from '@vue/reactivity'
import { Component, PureComponent } from 'react'
import type { ReactNode, ComponentType, FunctionComponent, ComponentClass } from 'react'
import { track, untrack } from './core'
import type { ReactiveComponentContext, RenderFunction } from './types'
import { useRender } from './hooks'

import {
  isArray,
  isMap,
  isSet,
  isObject,
  isPlainObject
} from '@vue/shared'

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
export function makeReactive<P, T extends ComponentType<P> = ComponentType<P>> (C: T, observe?: (props: P, context?: any) => any): T {
  if (typeof C !== 'function') {
    throw new TypeError('The first argument of makeReactive should be a React component')
  }
  if (observe != null && typeof observe !== 'function') {
    throw new TypeError('The second argument of makeReactive should be a function or undefined')
  }
  if ((C as any).$$isReactive) return C
  if (typeof C.prototype.render === 'function') {
    const Comp = C as ComponentClass<P>
    const Component = class extends Comp implements ReactiveComponentContext {
      $$reactiveRender: ReactiveEffectRunner<ReactNode> | null = null

      /** @override */
      render (): ReactNode {
        return track(this, () => {
          if (observe) {
            traverse(observe(this.props, this.context))
          }
          return super.render()
        })
      }

      /** @override */
      componentWillUnmount (): void {
        untrack(this)
        if (typeof super.componentWillUnmount === 'function') {
          super.componentWillUnmount()
        }
      }
    };
    (Component as any).$$isReactive = true
    return Component as unknown as T
  } else {
    const render = C as FunctionComponent<P>
    const Component: FunctionComponent<P> = function (...args: [P, any?]) {
      return useRender(() => {
        if (observe) {
          traverse(observe(...args))
        }
        return render(...args)
      })
    };
    ['propTypes', 'contextTypes', 'defaultProps', 'displayName'].forEach((k) => {
      if (k in render) {
        (Component as any)[k] = render[k as 'propTypes' | 'contextTypes' | 'defaultProps' | 'displayName']
      }
    });
    (Component as any).$$isReactive = true
    return Component as T
  }
}

function traverse<T> (value: T, seen: Set<unknown> = new Set()): T {
  if (!isObject(value) || (value as any).__v_skip) {
    return value
  }
  seen = seen || new Set()
  if (seen.has(value)) {
    return value
  }
  seen.add(value)
  if (isRef(value)) {
    traverse(value.value, seen)
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen)
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v: any) => {
      traverse(v, seen)
    })
  } else if (isPlainObject(value)) {
    for (const key in value) {
      traverse((value as any)[key], seen)
    }
  }
  return value
}
