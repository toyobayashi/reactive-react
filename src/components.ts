import { effectScope } from '@vue/reactivity'
import type { ReactiveEffectRunner } from '@vue/reactivity'
import { Component, PureComponent } from 'react'
import type { ReactNode } from 'react'
import { track, untrack } from './core'
import type { ReactiveComponentContext, RenderFunction } from './types'

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
