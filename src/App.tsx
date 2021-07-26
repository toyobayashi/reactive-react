import * as React from 'react'
import { reactive, ref, computed, ReactiveEffect } from '@vue/reactivity'
import type { Ref } from '@vue/reactivity'
import { useReactive, useMutableState, cleanup, trackRender } from './lib'
import type { ReactiveComponentContext } from './lib'

const deref: <T>(ref: Ref<T>) => T = ref => ref.value

const store = reactive({
  count: 0
})

const A: React.FC<{}> = function () {
  console.log('[render] A')
  return useReactive(() =>
    <div>A: {store.count}</div>
  )
}

class AClass extends React.Component<{}> implements ReactiveComponentContext {
  $$reactiveRender: ReactiveEffect<React.ReactNode> | null = null

  render () {
    console.log('[render] AClass')
    return trackRender(this, () => <div>AClass: {store.count}</div>)
  }

  componentWillUnmount () {
    cleanup(this)
  }
}

const B: React.FC<{}> = function () {
  console.log('[render] B')
  const doubleCount = useMutableState(computed(() => store.count * 2))
  return useReactive(() =>
    <div>B: {deref(doubleCount)}</div>
  )
}

class BClass extends React.Component<{}> implements ReactiveComponentContext {
  $$reactiveRender: ReactiveEffect<React.ReactNode> | null = null
  doubleCount = computed(() => store.count * 2)

  render () {
    console.log('[render] BClass')
    return trackRender(this, () => <div>BClass: {deref(this.doubleCount)}</div>)
  }

  componentWillUnmount () {
    cleanup(this)
  }
}

const C: React.FC<{}> = function () {
  console.log('[render] C')
  const localCount = useMutableState(ref(0))
  const localDoubleCount = useMutableState(computed(() => deref(localCount) * 2))
  const onClick = React.useCallback(() => {
    localCount.value++
  }, [])
  return useReactive(() =>
    <div>C: {deref(localCount)} * 2 = {deref(localDoubleCount)} <button onClick={onClick}>Local +</button></div>
  )
}

class CClass extends React.Component<{}> implements ReactiveComponentContext {
  $$reactiveRender: ReactiveEffect<React.ReactNode> | null = null
  localCount = ref(0)
  localDoubleCount = computed(() => deref(this.localCount) * 2)
  onClick = () => { this.localCount.value++ }

  render () {
    console.log('[render] CClass')
    return trackRender(this, () => {
      return <div>C: {deref(this.localCount)} * 2 = {deref(this.localDoubleCount)} <button onClick={this.onClick}>Local +</button></div>
    })
  }

  componentWillUnmount () {
    cleanup(this)
  }
}

const App: React.FC<{}> = function () {
  const onClick = React.useCallback(() => {
    store.count++
  }, [])

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
