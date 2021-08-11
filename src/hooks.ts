import { useState, useCallback, useRef, useEffect, ReactElement } from 'react'
import type { DependencyList } from 'react'
import type { RenderFunction } from './types'
import { untrack, track } from './core'
import { effectScope } from '@vue/reactivity'

const emptyDepList: DependencyList = []

/** @public */
export function useForceUpdate (): () => void {
  const setState = useState<{}>(null as any)[1]
  return useCallback(() => { setState(Object.create(null)) }, emptyDepList)
}

/** @public */
export function useMutable<T extends object> (factory: () => T): T {
  const ref = useRef<T>()
  if (ref.current == null) {
    const maybeObject = factory()
    if ((typeof maybeObject !== 'object' || maybeObject === null) && (typeof maybeObject !== 'function')) {
      throw new TypeError('useMutable callback must return object')
    }
    ref.current = maybeObject
  }
  return ref.current
}

/** @public */
export function useData<T extends object> (factory: () => T): T {
  const scope = useMutable(() => effectScope())
  const data = useMutable(() => scope.run(factory) as T)
  useEffect(() => () => { scope.stop() }, emptyDepList)
  return data
}

/** @public */
export function useRender (render: RenderFunction): ReactElement<any, any> | null {
  const forceUpdate = useForceUpdate()
  const context = useMutable(() => ({
    $$reactiveRender: null,
    forceUpdate
  }))
  useEffect(() => () => { untrack(context) }, emptyDepList)

  return track(context, render) as ReactElement<any, any> | null
}
