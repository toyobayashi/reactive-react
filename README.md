# reactive-react

10 行代码让 react 用上 `@vue/reactivity`

```bash
npm install
npm run serve
```

## 核心代码

共 10 行：

```js
import { effect, stop } from '@vue/reactivity'

function untrack (context) {
  if (context.$$reactiveRender) {
    stop(context.$$reactiveRender)
    context.$$reactiveRender = null
  }
}

function track (context, renderFunction) {
  untrack(context)
  context.$$reactiveRender = effect(renderFunction, {
    lazy: true,
    scheduler: () => { context.forceUpdate() }
  })
  return context.$$reactiveRender()
}
```

其中响应式组件上下文 `context` 长这样：

```ts
import type { ReactiveEffectRunner } from '@vue/reactivity'
import type { ReactNode } from 'react'

declare interface ReactiveComponentContext {
  $$reactiveRender: ReactiveEffectRunner<ReactNode> | null
  forceUpdate (callback?: () => void): void
}
```

核心思想就是把渲染函数用 vue 的 `effect` 包一层，JSX 中访问到的响应式对象会被依赖收集，有变更时自动更新组件。

## Hooks 写法

```js
import * as React from 'react'
import { ref, computed, effectScope } from '@vue/reactivity'

const emptyDepList = []

function useForceUpdate () {
  const setState = React.useState(null)[1]
  return React.useCallback(() => { setState(Object.create(null)) }, emptyDepList)
}

function useMutable (factory) {
  const ref = React.useRef()
  if (ref.current == null) {
    const maybeObject = factory()
    if ((typeof maybeObject !== 'object' || maybeObject === null) && (typeof maybeObject !== 'function')) {
      throw new TypeError('useMutable callback must return object')
    }
    ref.current = maybeObject
  }
  return ref.current
}

export function useData (factory) {
  const scope = useMutable(() => effectScope())
  const data = useMutable(() => scope.run(factory))
  React.useEffect(() => () => {
    scope.stop()
  }, emptyDepList)
  return data
}

function useReactiveContext () {
  const forceUpdate = useForceUpdate()
  return useMutable(() => ({
    $$reactiveRender: null,
    forceUpdate
  }))
}

function useRender (jsxFac) {
  // 响应式组件上下文
  const context = useReactiveContext()

  // 组件销毁取消监听
  React.useEffect(() => () => { untrack(context) }, emptyDepList)

  // 每次渲染重新依赖收集
  return track(context, jsxFac)
}

function Counter () {
  const data = useData(() => {
    const localCount = ref(0)
    const localDoubleCount = computed(() => localCount.value * 2)
    const onClick = () => {
      localCount.value++
    }
    return {
      localCount,
      localDoubleCount,
      onClick
    }
  })

  return useRender(() =>
    <div>{data.localCount.value} * 2 = {data.localDoubleCount.value} <button onClick={data.onClick}>Local +</button></div>
  )
}
```

## Class 写法

```js
import * as React from 'react'
import { ref, computed, effectScope } from '@vue/reactivity'

class ReactiveComponent extends React.Component {
  constructor (props) {
    super(props)
    // 组件实例本身当成响应式组件上下文
    this.$$reactiveRender = null
    // 响应式效果作用域
    this.$$scope = effectScope()
    this.$$scope.run(this.onCreateReactiveData.bind(this))
  }

  // @virtual
  onCreateReactiveData () {}

  renderReactive (render) {
    return track(this, render)
  }

  componentWillUnmount () {
    this.$$scope.stop()
    untrack(this)
  }
}

class Counter extends ReactiveComponent {
  constructor (props) {
    super(props) // onCreateReactiveData 被调用

    this.onClick = () => {
      this.localCount.value++
    }
  }

  onCreateReactiveData () {
    // 组件被卸载时清除所有收集到的响应式效果
    this.localCount = ref(0)
    this.localDoubleCount = computed(() => this.localCount.value * 2)
  }

  render () {
    // 每次渲染重新依赖收集
    return this.renderReactive(() => {
      return <div>{this.localCount.value} * 2 = {this.localDoubleCount.value} <button onClick={this.onClick}>Local +</button></div>
    })
  }

  componentWillUnmount () {
    // ...
    // 最后要调用父类的 componentWillUnmount
    super.componentWillUnmount()
  }
})
```

## 实现简易版的 Vuex

```js
import { reactive, computed } from '@vue/reactivity'

class StoreImpl {
  // getters
  // data

  constructor (store, state, getters) {
    this.resetState(store, state, getters, false)
  }

  resetState (store, state, getters, hot) {
    if (this._scope) this._scope.stop()
    this._scope = effectScope()
    this.getters = Object.create(null)
    const oldData = this.data
    const proxy = reactive({ $$state: state })
    if (getters) {
      Object.keys(getters).forEach((key) => {
        let computedRef
        Object.defineProperty(this.getters, key, {
          get: () => {
            if (!computedRef) {
              computedRef = this._scope.run(() => {
                return computed(() => getters[key].call(store, proxy.$$state, this.getters))
              })
            }
            return computedRef.value
          },
          enumerable: true
        })
      })
    }
    this.data = proxy
    if (oldData && hot) {
      oldData.$$state = null
    }
  }

  dispose () {
    if (this._disposed) return
    if (this._scope) this._scope.stop()
    this._scope = null!
    this.getters = null!
    this.data = null!
    this._disposed = true
  }
}

class Store {
  // __impl
  // mutations
  // actions

  constructor (options) {
    if (!options || !options.state) {
      throw new TypeError('missing state option')
    }
    Object.defineProperty(this, '__impl', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: new StoreImpl(this, options.state, options.getters)
    })

    Object.defineProperty(this, 'mutations', {
      configurable: true,
      value: Object.create(null)
    })

    Object.defineProperty(this, 'actions', {
      configurable: true,
      value: Object.create(null)
    })

    if (options.mutations) {
      Object.keys(options.mutations).forEach(key => {
        this.mutations[key] = (payload) => {
          options.mutations[key].call(this, this.state, payload)
        }
      })
    }
    if (options.actions) {
      const context = {
        state: this.state,
        getters: this.getters,
        commit: this.commit.bind(this),
        dispatch: this.dispatch.bind(this)
      }
      Object.keys(options.actions).forEach(key => {
        this.actions[key] = (payload) =>
          options.actions[key].call(this, context, payload)
      })
    }
  }

  get state () {
    return this.__impl.data.$$state
  }

  get getters () {
    return this.__impl.getters
  }

  commit (type, payload) {
    if (typeof this.mutations[type] === 'function') {
      this.mutations[type](payload)
    } else {
      throw new Error('unknown mutation: ' + type)
    }
  }

  dispatch (act, payload) {
    if (typeof this.actions[act] === 'function') {
      return this.actions[act](payload)
    }
    return Promise.reject(new Error('unknown action: ' + act))
  }

  dispose (): void {
    if (this.__impl) {
      this.__impl.dispose()
      this.__impl = null
      this.mutations = null
      this.actions = null
    }
  }
}
```
