# reactive-react

[API Documentation](https://github.com/toyobayashi/reactive-react/blob/main/docs/api/index.md)

[中文](https://github.com/toyobayashi/reactive-react/blob/main/test)

## Example

### Hooks

```jsx
import * as React from 'react'
import { ref, computed } from '@vue/reactivity'
import { useData, useRender } from '@tybys/reactive-react'

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
    <div>
      {data.localCount.value} * 2 = {data.localDoubleCount.value}
      <button onClick={data.onClick}>+</button>
    </div>
  )
}
```

### Class

```jsx
import * as React from 'react'
import { ref, computed } from '@vue/reactivity'
import { ReactiveComponent } from '@tybys/reactive-react'

class Counter extends ReactiveComponent {
  constructor (props) {
    super(props) // onCreateReactiveData will be called

    this.onClick = () => {
      this.localCount.value++
    }
  }

  /** @override */
  onCreateReactiveData () {
    // all reactive effect should be collected here
    this.localCount = ref(0)
    this.localDoubleCount = computed(() => this.localCount.value * 2)
  }

  render () {
    return this.renderReactive(() =>
      <div>
        {this.localCount.value} * 2 = {this.localDoubleCount.value}
        <button onClick={this.onClick}>+</button>
      </div>
    )
  }

  /** @override */
  componentWillUnmount () {
    // ...
    super.componentWillUnmount()
  }
})
```

### HOC

```jsx
import * as React from 'react'
import { AnyComponent } from 'xx-react-component-library'
import { makeReactive } from '@tybys/reactive-react'

const ReactiveAnyComponent = makeReactive(AnyComponent, (props) => ([
  props.xxProp,
  propsx.xxProp2
]))

<ReactiveAnyComponent xxProp={yourReactiveData} xxProp2={yourReactiveData2} />
```

### Global State Management

Like vuex:

```jsx
import * as React from 'react'
import { createStore } from '@tybys/reactive-react'

const store = createStore({
  state: {
    count: 0
  },
  getters: {
    doubleCount (state /*, getters */) {
      return state.count * 2
    }
  },
  mutations: {
    add (state, value = 1) {
      state.count += value
    },
    multi (state, value = 2) {
      state.count *= value
    }
  },
  actions: {
    multi ({ commit /*, state, getters, dispatch */}, value = 2) {
      return new Promise((resolve) => {
        setTimeout(() => {
          commit('multi', value)
          resolve()
        }, 200)
      })
    }
  }
})

function Counter () {
  const data = useData(() => {
    const commit = () => {
      store.mutations.add(10)
      // or store.commit('add', 10)
    }
    const dispatch = () => {
      store.actions.multi(5)
      // or store.dispatch('multi', 5)
    }
    return { commit, dispatch }
  })

  return useRender(() =>
    <div>
      {store.state.count} * 2 = {store.getters.doubleCount}
      <button onClick={data.commit}>+</button>
      <button onClick={data.dispatch}>x</button>
    </div>
  )
}
```
