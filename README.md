# reactive-react

10 行代码让 react 用上 `@vue/reactivity`

```bash
npm install
npm run serve
```

核心代码 10 行：

```js
import { effect, stop } from '@vue/reactivity'

function cleanup (context) {
  if (context.$$runner) {
    stop(context.$$runner)
    context.$$runner = null
  }
}

function trackRender (context, renderFunction, forceUpdate) {
  cleanup(context)
  context.$$runner = effect(renderFunction, {
    lazy: true,
    scheduler: () => { forceUpdate() }
  })
  return context.$$runner()
}
```

Hooks 写法：

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
  const context = React.useRef({
    $$runner: null
  }).current
  React.useEffect(() => () => { cleanup(context) }, [])

  return trackRender(context, jsxFac, forceUpdate)
}

function Component () {
  const localState = useMutableState(ref(0))
  const localComputed = useMutableState(computed(() => localState.value * 2))
  return useReactive(() => (/* JSX */))
}
```

Class 写法

```js
import * as React from 'react'
import { ref, computed } from '@vue/reactivity'

function makeReactive (C) {
  return class extends C {
    constructor (props) {
      super(props)
      this.$$runner = null
    }

    render () {
      return trackRender(this, () => super.render(), () => { this.forceUpdate() })
    }

    componentWillUnmount () {
      cleanup(this)
    }
  }
}

const Component = makeReactive(class extends React.Component {
  constructor (props) {
    super(props)
    this.localState = ref(0)
    this.localComputed = computed(() => this.localState.value * 2)
  }

  render () {
    return (/* JSX */)
  }
})
```
