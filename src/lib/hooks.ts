import { useState, useCallback, useRef, useEffect, ReactElement } from 'react'
import type { ReactiveComponentContext, RenderFunction } from './types'
import { cleanup, trackRender } from './core'

export function useForceUpdate (): () => void {
  const setState = useState<{}>(Object.create(null))[1]
  return useCallback((): void => { setState(Object.create(null)) }, [])
}

export function useMutableState<T> (value: T): T {
  return useState(value)[0]
}

export function useReactive (jsxFac: RenderFunction): ReactElement<any, any> | null {
  const forceUpdate = useForceUpdate()
  const context = useRef<ReactiveComponentContext>({
    $$reactiveRender: null,
    forceUpdate
  }).current
  useEffect(() => () => { cleanup(context) }, [])

  return trackRender(context, jsxFac) as ReactElement<any, any>
}
