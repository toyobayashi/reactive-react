import * as React from 'react'
import { reactive, ref, computed, ReactiveEffect } from '@vue/reactivity'
import { useRender, useMutable, untrack, track, emptyDepList, deref } from './lib'
import type { ReactiveComponentContext } from './lib'

const store = reactive({
  count: 0
})

const A: React.FC<{}> = function () {
  console.log('[render] A')
  return useRender(() =>
    <div>A: {store.count}</div>
  )
}

class AClass extends React.Component<{}> implements ReactiveComponentContext {
  $$reactiveRender: ReactiveEffect<React.ReactNode> | null = null

  render () {
    console.log('[render] AClass')
    return track(this, () => <div>AClass: {store.count}</div>)
  }

  componentWillUnmount () {
    untrack(this)
  }
}

const B: React.FC<{}> = function () {
  console.log('[render] B')
  const doubleCount = useMutable(() => computed(() => store.count * 2))
  return useRender(() =>
    <div>B: {deref(doubleCount)}</div>
  )
}

class BClass extends React.Component<{}> implements ReactiveComponentContext {
  $$reactiveRender: ReactiveEffect<React.ReactNode> | null = null
  doubleCount = computed(() => store.count * 2)

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
  const onClick = React.useCallback(() => {
    store.count++
  }, emptyDepList)

  return <>
    <button onClick={onClick}>+</button>
    <A />
    <AClass />
    <B />
    <BClass />
    <C />
    <CClass />
  </>
}

export default App
