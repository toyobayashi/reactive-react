import { useState, useCallback, useRef } from 'react'
import { effect, stop } from '@vue/reactivity'
import type { ReactiveEffect } from '@vue/reactivity'

export function useForceUpdate (): () => void {
  const setState = useState<{}>(Object.create(null))[1]
  return useCallback((): void => { setState(Object.create(null)) }, [])
}

export function useMutableState<T> (value: T): T {
  return useState(value)[0]
}

export function useReactive<E extends React.ReactElement | null> (jsxFac: () => E): E {
  const forceUpdate = useForceUpdate()
  const ref = useRef({
    runner: null as ReactiveEffect<E> | null
  })
  if (ref.current.runner) {
    stop(ref.current.runner)
  }

  ref.current.runner = effect(() => jsxFac(), {
    lazy: true,
    scheduler () {
      forceUpdate()
    }
  })

  return ref.current.runner()
}
