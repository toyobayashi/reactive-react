import * as React from 'react'
import { ref, computed } from '@vue/reactivity'
import type { Ref, ComputedRef } from '@vue/reactivity'
import { useRender, useData, ReactiveComponent, createStore } from '../..'
/* import type { GetterHandler, MutationHandler, ActionHandler } from '../..'

interface IState {
  count: number
  mountC: boolean
}

type GettersTree = {
  doubleCount: GetterHandler<IState, GettersTree, number>
}

type Mutations = {
  add: MutationHandler<IState, [number?]>
  multi: MutationHandler<IState, [number?]>
  toggleC: MutationHandler<IState, []>
}

type Actions = {
  multi: ActionHandler<IState, GettersTree, Mutations, Actions, [number?], void>
} */

const store = createStore/* <IState, GettersTree, Mutations, Actions> */({
  state: {
    count: 0,
    mountC: true
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
    },
    toggleC (state) {
      state.mountC = !state.mountC
    }
  },
  actions: {
    multi ({ commit }, value: number = 2) {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          commit('multi', value)
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

class AClass extends ReactiveComponent<{}> {
  render () {
    console.log('[render] AClass')
    return this.renderReactive(() => <div>AClass: {store.state.count}</div>)
  }
}

const B: React.FC<{}> = function () {
  console.log('[render] B')
  const doubleCount = useData(() => computed(() => store.state.count * 2))
  return useRender(() =>
    <div>B: {deref(doubleCount)}, B: {store.getters.doubleCount}</div>
  )
}

class BClass extends ReactiveComponent<{}> {
  doubleCount!: ComputedRef<number>

  render () {
    console.log('[render] BClass')
    return this.renderReactive(() => <div>BClass: {deref(this.doubleCount)}</div>)
  }

  onCreateReactiveData () {
    this.doubleCount = computed(() => store.state.count * 2)
  }

  componentWillUnmount () {
    super.componentWillUnmount()
  }
}

const C: React.FC<{}> = function () {
  console.log('[render] C')
  const data = useData(() => {
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

class CClass extends ReactiveComponent<{}> {
  localCount!: Ref<number>
  localDoubleCount!: ComputedRef<number>
  onClick = () => { this.localCount.value++ }

  onCreateReactiveData () {
    this.localCount = ref(0)
    this.localDoubleCount = computed(() => deref(this.localCount) * 2)
  }

  render () {
    console.log('[render] CClass')
    return this.renderReactive(() => {
      return <div>CClass: {deref(this.localCount)} * 2 = {deref(this.localDoubleCount)} <button onClick={this.onClick}>Local +</button></div>
    })
  }

  componentWillUnmount () {
    // ...
    super.componentWillUnmount()
  }
}

const CWrap: React.FC<{}> = function () {
  return useRender(() => {
    return <>{store.state.mountC ? <C /> : null}</>
  })
}

const App: React.FC<{}> = function () {
  const data = useData(() => {
    return {
      onClick: () => {
        store.mutations.add()
      },
      onClick2: () => {
        store.actions.multi()
      },
      toggleC: () => {
        store.mutations.toggleC()
      }
    }
  })

  return <>
    <button onClick={data.onClick}>+</button>
    <button onClick={data.onClick2}>x</button>
    <button onClick={data.toggleC}>toggleC</button>
    <A />
    <AClass />
    <B />
    <BClass />
    <CWrap />
    <CClass />
  </>
}

function deref<T> (r: Ref<T>): T {
  return r.value
}

export default App
