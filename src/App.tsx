import * as React from 'react'
import { reactive, ref, computed } from '@vue/reactivity'
import type { Ref } from '@vue/reactivity'
import { useReactive, useMutableState } from './hooks'

const deref: <T>(ref: Ref<T>) => T = ref => ref.value

const store = reactive({
  count: 0
})

const A: React.FC<{}> = function () {
  console.log('A render')
  return useReactive(() =>
    <div>A: {store.count}</div>
  )
}

const B: React.FC<{}> = function () {
  console.log('B render')
  const doubleCount = useMutableState(computed(() => store.count * 2))
  return useReactive(() =>
    <div>B: {deref(doubleCount)}</div>
  )
}

const C: React.FC<{}> = function () {
  console.log('C render')
  const localCount = useMutableState(ref(0))
  const localDoubleCount = useMutableState(computed(() => deref(localCount) * 2))
  const onClick = React.useCallback(() => {
    localCount.value++
  }, [])
  return useReactive(() =>
    <div>C: {deref(localCount)} * 2 = {deref(localDoubleCount)} <button onClick={onClick}>Local +</button></div>
  )
}

const App: React.FC<{}> = function () {
  const onClick = React.useCallback(() => {
    store.count++
  }, [])

  return <>
    <button onClick={onClick}>+</button>
    <A />
    <B />
    <C />
  </>
}

export default App
