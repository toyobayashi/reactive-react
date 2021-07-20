# reactive-react

20 行代码让 react 用上 `@vue/reactivity`

```bash
npm install
npm run serve
```

```js
import { useRef } from 'react'
import { effect, stop } from '@vue/reactivity'

function useReactive (jsxFac) {
  const forceUpdate = useForceUpdate()
  const ref = useRef({
    runner: null
  })
  if (ref.current.runner) {
    // 每次渲染先清理上次的响应式监听
    stop(ref.current.runner)
  }

  ref.current.runner = effect(() => jsxFac(), {
    lazy: true,
    scheduler () {
      forceUpdate()
    }
  })

  // 重新收集 JSX 中访问到的响应式对象，有变化时更新当前组件
  return ref.current.runner()
}

function Component () {
  // ...
  return useReactive(() => (/* JSX */))
}
```
