import { reactive, computed, effectScope, EffectScope } from '@vue/reactivity'
import type { ComputedRef } from '@vue/reactivity'

/** @public */
export type Payload<T> = T extends undefined
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ? void
  : T

/** @public */
export type MutationKey<M> = M extends IMutationsTree<any> ? keyof M : (string | number | symbol)
/** @public */
export type MutationPayload<M, K extends keyof M = keyof M> = M extends IMutationsTree<any> ? Payload<Parameters<M[K]>[1]> : any
/** @public */
export type ActionKey<A> = A extends IActionsTree<any, any, any, any> ? keyof A : (string | number | symbol)
/** @public */
export type ActionPayload<A, K extends keyof A = keyof A> = A extends IActionsTree<any, any, any, any> ? Payload<Parameters<A[K]>[1]> : any

/** @public */
export type CommitParam<M> = M extends IMutationsTree<any> ? [MutationKey<M>, MutationPayload<M>?] : [string | number | symbol, any?]
/** @public */
export type DispatchParam<A> = A extends IActionsTree<any, any, any, any> ? [ActionKey<A>, ActionPayload<A>?] : [string | number | symbol, any?]

/** @public */
export type Getters<G> = G extends IGettersTree<any, any> ? { [K in keyof G]: ReturnType<G[K]> } : Record<string, any>
/** @public */
export type Mutations<M extends IMutationsTree<any>> = { [K in keyof M]: (payload: Payload<Parameters<M[K]>[1]>) => void }
/** @public */
export type Actions<A extends IActionsTree<any, any, any, any>> = { [K in keyof A]: (payload: Payload<Parameters<A[K]>[1]>) => ReturnType<A[K]> }

/** @public */
export type GetterHandler<S extends object, G extends IGettersTree<S, G>, R> = (state: S, getters: Getters<G>) => R
/** @public */
export type MutationHandler<S extends object, P extends [any?]> = (...args: [S, ...P]) => void
/** @public */
export type ActionHandler<
  S extends object,
  G extends IGettersTree<S, G>,
  M extends IMutationsTree<S>,
  A extends IActionsTree<S, G, M, A>,
  P extends [any?],
  R
> = (...args: [IActionContext<S, G, M, A>, ...P]) => Promise<R>

/** @public */
export interface IGettersTree<S extends object, G extends IGettersTree<S, G>> {
  [x: string]: GetterHandler<S, G, any>
}

/** @public */
export interface IMutationsTree<S extends object> {
  [x: string]: MutationHandler<S, [any?]>
}

/** @public */
export interface IActionContext<S extends object, G extends IGettersTree<S, G>, M extends IMutationsTree<S>, A extends IActionsTree<S, G, M, A>> {
  state: S
  getters: Getters<G>
  commit (...args: CommitParam<M>): void
  dispatch (...args: DispatchParam<A>): ReturnType<A[typeof args[0]]>
}

/** @public */
export interface IActionsTree<S extends object, G extends IGettersTree<S, G>, M extends IMutationsTree<S>, A extends IActionsTree<S, G, M, A>> {
  [x: string]: ActionHandler<S, G, M, A, [any?], any>
}

/** @public */
export interface IStoreBase<S extends object, G extends IGettersTree<S, G>> {
  state: S
  getters: Getters<G>
}

/** @public */
export interface IStore<S extends object, G extends IGettersTree<S, G>, M extends IMutationsTree<S>, A extends IActionsTree<S, G, M, A>> extends Readonly<IStoreBase<S, G>> {
  readonly mutations: Mutations<M>
  readonly actions: Actions<A>

  replaceState (state: S): void
  hotUpdate (options?: { getters?: G }): void
  commit (type: keyof M, payload: Payload<Parameters<M[typeof type]>[1]>): void
  dispatch (act: keyof A, payload: Payload<Parameters<A[typeof act]>[1]>): ReturnType<A[typeof act]>
  toJSON (): IStoreBase<S, G>
  toString (): string
}

/** @public */
export interface IStoreOptions<S extends object, G extends IGettersTree<S, G>, M extends IMutationsTree<S>, A extends IActionsTree<S, G, M, A>> {
  state: S
  getters?: G
  mutations?: M
  actions?: A
}

interface IObservedData<T> {
  $$state: T
}

class StoreImpl<S extends object, G extends IGettersTree<S, G>> {
  public getters!: Getters<G>
  public data!: IObservedData<S>
  private _scope!: EffectScope
  private _disposed = false

  public constructor (store: Store<S, G, any, any>, state: S, getters?: G) {
    this.resetState(store, state, getters, false)
  }

  public resetState (store: Store<S, G, any, any>, state: S, getters?: G, hot?: boolean): void {
    this._scope?.stop()
    this._scope = effectScope()
    this.getters = Object.create(null)
    const oldData = this.data
    const proxy: IObservedData<S> = reactive({ $$state: state }) as IObservedData<S>
    if (getters) {
      Object.keys(getters).forEach((key) => {
        let computedRef: ComputedRef<ReturnType<G[typeof key]>>
        Object.defineProperty(this.getters, key, {
          get: () => {
            if (!computedRef) {
              computedRef = this._scope.run(() => {
                return computed(() => getters[key].call(store, proxy.$$state, this.getters))
              })!
            }
            return computedRef.value
          },
          enumerable: true
        })
      })
    }
    this.data = proxy
    if (oldData && hot) {
      oldData.$$state = null!
    }
  }

  public dispose (): void {
    if (this._disposed) return
    this._scope?.stop()
    this._scope = null!
    this.getters = null!
    this.data = null!
    this._disposed = true
  }
}

/** @public */
export class Store<S extends object, G extends IGettersTree<S, G>, M extends IMutationsTree<S>, A extends IActionsTree<S, G, M, A>> implements IStore<S, G, M, A> {
  private __impl!: StoreImpl<S, G>
  public readonly mutations!: Mutations<M>
  public readonly actions!: Actions<A>

  public constructor (options: IStoreOptions<S, G, M, A>) {
    if (!options || !options.state) {
      throw new TypeError('missing state option')
    }
    Object.defineProperty(this, '__impl', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: new StoreImpl(this, options.state, options.getters)
    })

    Object.defineProperty(this, 'mutations', {
      configurable: true,
      value: Object.create(null)
    })

    Object.defineProperty(this, 'actions', {
      configurable: true,
      value: Object.create(null)
    })

    if (options.mutations) {
      Object.keys(options.mutations).forEach((key: keyof typeof options.mutations) => {
        this.mutations[key] = (payload) => {
          options.mutations![key].call(this, this.state, payload)
        }
      })
    }
    if (options.actions) {
      const context: IActionContext<S, G, M, A> = {
        state: this.state,
        getters: this.getters,
        commit: this.commit.bind(this) as (...args: CommitParam<M>) => void,
        dispatch: this.dispatch.bind(this) as (...args: DispatchParam<A>) => ReturnType<A[typeof args[0]]>
      }
      Object.keys(options.actions).forEach((key: keyof typeof options.actions) => {
        this.actions[key] = (payload) => {
          return options.actions![key].call(this, context, payload) as ReturnType<A[keyof typeof options.actions]>
        }
      })
    }
  }

  public get state (): S {
    return this.__impl.data.$$state
  }

  public get getters (): Getters<G> {
    return this.__impl.getters
  }

  public replaceState (state: S): void {
    this.__impl.data.$$state = state
  }

  public hotUpdate (options?: { getters?: G }): void {
    if (options?.getters) {
      this.__impl.resetState(this, this.state, options.getters, true)
    }
  }

  public commit (type: keyof M, payload: Payload<Parameters<M[typeof type]>[1]>): void {
    if (typeof this.mutations[type] === 'function') {
      this.mutations[type](payload)
    } else {
      throw new Error(`unknown mutation: ${String(type)}`)
    }
  }

  public dispatch (act: keyof A, payload: Payload<Parameters<A[typeof act]>[1]>): ReturnType<A[typeof act]> {
    if (typeof this.actions[act] === 'function') {
      return this.actions[act](payload)
    }
    return Promise.reject(new Error(`unknown action: ${String(act)}`)) as ReturnType<A[typeof act]>
  }

  public toJSON (): IStoreBase<S, G> {
    return { state: this.state, getters: this.getters }
  }

  /** @override */
  public toString (): string {
    return JSON.stringify(this.toJSON())
  }

  public dispose (): void {
    if (this.__impl) {
      this.__impl.dispose()
      this.__impl = null!;
      (this as any).mutations = null;
      (this as any).actions = null
    }
  }
}
