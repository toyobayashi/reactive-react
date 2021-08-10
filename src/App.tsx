import * as React from 'react'
import { ref, computed, ReactiveEffect } from '@vue/reactivity'
import { useRender, useMutable, untrack, track, deref } from './lib'
import type { ReactiveComponentContext } from './lib'
import { Store } from './lib/store'
/* import type { IActionContext, GetterHandler, MutationHandler, ActionHandler } from './lib/store'

interface IState {
  count: number
}

type GettersTree = {
  doubleCount: GetterHandler<IState, GettersTree, number>
}

type Mutations = {
  add: MutationHandler<IState, [number?]>
  multi: MutationHandler<IState, [number?]>
}

type Actions = {
  multi: ActionHandler<IActionContext<IState, GettersTree, Mutations, Actions>, [string?], void>
} */

const store = new Store/* <IState, GettersTree, Mutations, Actions> */({
  state: {
    count: 0
  },
  getters: {
    doubleCount (state) {
      return state.count * 2
    }
  },
  mutations: {
    add (state, value: number = 1) {
      state.count += value
    },
    multi (state, value: number = 2) {
      state.count *= value
    }
  },
  actions: {
    multi ({ commit }) {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          commit('multi')
          resolve()
        }, 200)
      })
    }
  }
})

const A: React.FC<{}> = function () {
  console.log('[render] A')
  return useRender(() =>
    <div>A: {store.state.count}</div>
  )
}

class AClass extends React.Component<{}> implements ReactiveComponentContext {
  $$reactiveRender: ReactiveEffect<React.ReactNode> | null = null

  render () {
    console.log('[render] AClass')
    return track(this, () => <div>AClass: {store.state.count}</div>)
  }

  componentWillUnmount () {
    untrack(this)
  }
}

const B: React.FC<{}> = function () {
  console.log('[render] B')
  const doubleCount = useMutable(() => computed(() => store.state.count * 2))
  return useRender(() =>
    <div>B: {deref(doubleCount)}</div>
  )
}

class BClass extends React.Component<{}> implements ReactiveComponentContext {
  $$reactiveRender: ReactiveEffect<React.ReactNode> | null = null
  doubleCount = computed(() => store.state.count * 2)

  render () {
    console.log('[render] BClass')
    return track(this, () => <div>BClass: {deref(this.doubleCount)}</div>)
  }

  componentWillUnmount () {
    untrack(this)
  }
}

const C: React.FC<{}> = function () {
  console.log('[render] C')
  const data = useMutable(() => {
    const localCount = ref(0)
    const localDoubleCount = computed(() => deref(localCount) * 2)
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
    <div>C: {deref(data.localCount)} * 2 = {deref(data.localDoubleCount)} <button onClick={data.onClick}>Local +</button></div>
  )
}

class CClass extends React.Component<{}> implements ReactiveComponentContext {
  $$reactiveRender: ReactiveEffect<React.ReactNode> | null = null
  localCount = ref(0)
  localDoubleCount = computed(() => deref(this.localCount) * 2)
  onClick = () => { this.localCount.value++ }

  render () {
    console.log('[render] CClass')
    return track(this, () => {
      return <div>C: {deref(this.localCount)} * 2 = {deref(this.localDoubleCount)} <button onClick={this.onClick}>Local +</button></div>
    })
  }

  componentWillUnmount () {
    untrack(this)
  }
}

const App: React.FC<{}> = function () {
  const data = useMutable(() => {
    return {
      onClick: () => {
        store.mutations.add()
      },
      onClick2: () => {
        store.actions.multi()
      }
    }
  })

  return <>
    <button onClick={data.onClick}>+</button>
    <button onClick={data.onClick2}>x</button>
    <A />
    <AClass />
    <B />
    <BClass />
    <C />
    <CClass />
  </>
}

export default App
