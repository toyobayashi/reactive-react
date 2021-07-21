import * as React from 'react'
import { reactive, ref, computed } from '@vue/reactivity'
import type { Ref } from '@vue/reactivity'
import { useReactive, useMutableState, makeReactive } from './lib'

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

const AClass = makeReactive(class extends React.Component {
  render () {
    console.log('[render] AClass')
    return <div>AClass: {store.count}</div>
  }
})

const B: React.FC<{}> = function () {
  console.log('[render] B')
  const doubleCount = useMutableState(computed(() => store.count * 2))
  return useReactive(() =>
    <div>B: {deref(doubleCount)}</div>
  )
}

const BClass = makeReactive(class extends React.Component<{}> {
  doubleCount = computed(() => store.count * 2)

  render () {
    console.log('[render] BClass')
    return <div>BClass: {deref(this.doubleCount)}</div>
  }
})

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

const CClass = makeReactive(class extends React.Component<{}> {
  localCount = ref(0)
  localDoubleCount = computed(() => deref(this.localCount) * 2)
  onClick = () => { this.localCount.value++ }

  render () {
    console.log('[render] CClass')
    return <div>C: {deref(this.localCount)} * 2 = {deref(this.localDoubleCount)} <button onClick={this.onClick}>Local +</button></div>
  }
})

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
