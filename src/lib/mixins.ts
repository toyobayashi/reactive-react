import type { ReactiveEffect } from "@vue/reactivity"
import type { Component, ReactElement } from "react"
import { cleanup, trackRender } from "./core"
import type { ReactiveComponentContext } from "./types"

export function makeReactive<T extends new (...args: any[]) => Component> (C: T): T {
  return class extends C implements ReactiveComponentContext {
    $$runner: ReactiveEffect<ReactElement<any, any> | null> | null = null

    render () {
      return trackRender(this, () => super.render(), () => { this.forceUpdate() })
    }

    componentWillUnmount () {
      cleanup(this)
    }
  }
}
