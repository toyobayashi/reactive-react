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

function cleanup (context) {
  if (context.$$reactiveRender) {
    stop(context.$$reactiveRender)
    context.$$reactiveRender = null
  }
}

function trackRender (context, renderFunction) {
  cleanup(context)
  context.$$reactiveRender = effect(renderFunction, {
    lazy: true,
    scheduler: () => { context.forceUpdate() }
  })
  return context.$$reactiveRender()
}
```

其中响应式组件上下文 `context` 长这样：

```ts
import type { ReactiveEffect } from '@vue/reactivity'
import type { ReactNode } from 'react'

interface ReactiveComponentContext {
  $$reactiveRender: ReactiveEffect<ReactNode> | null
  forceUpdate (callback?: () => void): void
}
```

核心思想就是把渲染函数用 vue 的 `effect` 包一层，JSX 中访问到的响应式对象会被依赖收集，有变更时自动更新组件。

## Hooks 写法

```js
import * as React from 'react'
import { ref, computed } from '@vue/reactivity'

function useForceUpdate () {
  const setState = React.useState(Object.create(null))[1]
  return React.useCallback(() => { setState(Object.create(null)) }, [])
}

function useMutableState (value) {
  return React.useState(value)[0]
}

function useReactive (jsxFac) {
  const forceUpdate = useForceUpdate()

  // 响应式组件上下文
  const context = React.useRef({
    $$reactiveRender: null,
    forceUpdate
  }).current

  // 组件销毁取消监听
  React.useEffect(() => () => { cleanup(context) }, [])

  // 每次渲染重新依赖收集
  return trackRender(context, jsxFac)
}

function ReactiveComponent () {
  const localState = useMutableState(ref(0))
  const localComputed = useMutableState(computed(() => localState.value * 2))
  return useReactive(() => (/* JSX 中可访问响应式对象 */))
}
```

## Class 写法

```js
import * as React from 'react'
import { ref, computed } from '@vue/reactivity'

class ReactiveComponent extends React.Component {
  constructor (props) {
    super(props)

    // 组件实例本身当成响应式组件上下文
    this.$$reactiveRender = null

    this.localState = ref(0)
    this.localComputed = computed(() => this.localState.value * 2)
  }

  render () {
    // ...

    // 每次渲染重新依赖收集
    return trackRender(this, () => (/* JSX 中可访问响应式对象 */))
  }

  componentWillUnmount () {
    // 组件销毁取消监听
    cleanup(this)
  }
})
```
