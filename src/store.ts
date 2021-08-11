import { reactive, computed, effectScope, EffectScope } from '@vue/reactivity'
import type { ComputedRef } from '@vue/reactivity'

/** @public */
export type Index = string | number | symbol

/** @public */
export type SecondParam<T, K extends keyof T> = T extends Record<string, (...args: any[]) => any>
  ? Parameters<T[K]>[1]
  : never

/** @public */
export type ActionReturnType<T, K extends Index | keyof T> = T extends ActionsTree<any, any, any, any>
  ? ReturnType<T[K]>
  : Promise<any>

/** @public */
export type Payload<T> = T extends undefined
  ? []
  : [T]

/** @public */
export type MutationKey<M> = M extends MutationsTree<any> ? keyof M : Index
/** @public */
export type MutationPayload<M, K extends keyof M = keyof M> = M extends MutationsTree<any> ? Payload<SecondParam<M, K>> : any
/** @public */
export type ActionKey<A> = A extends ActionsTree<any, any, any, any> ? keyof A : Index
/** @public */
export type ActionPayload<A, K extends keyof A = keyof A> = A extends ActionsTree<any, any, any, any> ? Payload<SecondParam<A, K>> : any

/** @public */
export type Getters<G> = G extends GettersTree<any, any> ? { [K in keyof G]: ReturnType<G[K]> } : Record<string, any>
/** @public */
export type Mutations<M extends MutationsTree<any>> = { [K in keyof M]: (...payload: Payload<SecondParam<M, K>>) => void }
/** @public */
export type Actions<A extends ActionsTree<any, any, any, any>> = { [K in keyof A]: (...payload: Payload<SecondParam<A, K>>) => ActionReturnType<A, K> }

/** @public */
export type GetterHandler<S extends object, G extends GettersTree<S, G>, R> = (state: S, getters: Getters<G>) => R
/** @public */
export type MutationHandler<S extends object, P extends [any?]> = (...args: [S, ...P]) => void
/** @public */
export type ActionHandler<
  S extends object,
  G extends GettersTree<S, G>,
  M extends MutationsTree<S>,
  A extends ActionsTree<S, G, M, A>,
  P extends [any?],
  R
> = (...args: [IActionContext<S, G, M, A>, ...P]) => Promise<R>

/** @public */
export type GettersTree<S extends object, G extends GettersTree<S, G>> = Record<Index, GetterHandler<S, G, any>>

/** @public */
export type MutationsTree<S extends object> = Record<Index, MutationHandler<S, [any?]>>

/** @public */
export interface IActionContext<S extends object, G extends GettersTree<S, G>, M extends MutationsTree<S>, A extends ActionsTree<S, G, M, A>> {
  state: S
  getters: Getters<G>
  commit<K extends keyof M | Index> (type: K, ...payload: Payload<SecondParam<M, K>>): void
  dispatch<K extends keyof A | Index> (act: K, ...payload: Payload<SecondParam<A, K>>): ActionReturnType<A, typeof act>
}

/** @public */
export type ActionsTree<S extends object, G extends GettersTree<S, G>, M extends MutationsTree<S>, A extends ActionsTree<S, G, M, A>> =
  Record<Index, ActionHandler<S, G, M, A, [any?], any>>

/** @public */
export interface IStoreBase<S extends object, G extends GettersTree<S, G>> {
  state: S
  getters: Getters<G>
}

/** @public */
export interface IStore<S extends object, G extends GettersTree<S, G> | {}, M extends MutationsTree<S> | {}, A extends ActionsTree<S, G, M, A> | {}> extends Readonly<IStoreBase<S, G>> {
  readonly mutations: Mutations<M>
  readonly actions: Actions<A>

  replaceState (state: S): void
  hotUpdate (options?: { getters?: G }): void
  commit<K extends keyof M> (type: K, ...payload: Payload<SecondParam<M, K>>): void
  dispatch<K extends keyof A> (act: K, ...payload: Payload<SecondParam<A, K>>): ActionReturnType<A, K>
  toJSON (): IStoreBase<S, G>
  toString (): string
}

/** @public */
export interface IStoreOptions<S extends object, G extends GettersTree<S, G>, M extends MutationsTree<S>, A extends ActionsTree<S, G, M, A>> {
  state: S
  getters?: G
  mutations?: M
  actions?: A
}

interface IObservedData<T> {
  $$state: T
}

class StoreImpl<S extends object, G extends GettersTree<S, G>> {
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
class Store<S extends object, G extends GettersTree<S, G> | {}, M extends MutationsTree<S> | {}, A extends ActionsTree<S, G, M, A> | {}> implements IStore<S, G, M, A> {
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
      Object.keys(options.mutations).forEach((key: string) => {
        this.mutations[key as keyof M] = (...payload) => {
          (options.mutations as MutationsTree<S>)[key].call(this, this.state, payload[0])
        }
      })
    }
    if (options.actions) {
      const context: IActionContext<S, G, M, A> = {
        state: this.state,
        getters: this.getters,
        commit: (type: any, ...payload) => { this.commit(type, ...payload) },
        dispatch: (act: any, ...payload) => this.dispatch(act, ...payload)
      }
      Object.keys(options.actions).forEach((key: string) => {
        this.actions[key as keyof A] = (...payload) => {
          return ((options.actions as A)[key as keyof A] as unknown as Function)
            .call(this, context, ...payload)
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

  public commit<K extends keyof M> (type: K, ...payload: Payload<SecondParam<M, K>>): void {
    if (typeof this.mutations[type] === 'function') {
      this.mutations[type](...payload)
    } else {
      throw new Error(`unknown mutation: ${String(type)}`)
    }
  }

  public dispatch<K extends keyof A> (act: K, ...payload: Payload<SecondParam<A, K>>): ActionReturnType<A, K> {
    if (typeof this.actions[act] === 'function') {
      return this.actions[act](...payload)
    }
    return Promise.reject(new Error(`unknown action: ${String(act)}`)) as ActionReturnType<A, K>
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

export function createStore<
  S extends object,
  G extends GettersTree<S, G> | {},
  M extends MutationsTree<S> | {},
  A extends ActionsTree<S, G, M, A> | {}
> (options: IStoreOptions<S, G, M, A>): IStore<S, G, M, A> {
  return new Store(options)
}
