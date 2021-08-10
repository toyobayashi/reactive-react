import { reactive, computed } from '@vue/reactivity'
import type { ComputedRef } from '@vue/reactivity'

export type Payload<T> = T extends undefined ? void : T

export type MutationKey<M> = M extends IMutationsTree<any> ? keyof M : (string | number | symbol)
export type MutationPayload<M, K extends keyof M = keyof M> = M extends IMutationsTree<any> ? Payload<Parameters<M[K]>[1]> : any
export type ActionKey<A> = A extends IActionsTree<any, any, any, any> ? keyof A : (string | number | symbol)
export type ActionPayload<A, K extends keyof A = keyof A> = A extends IActionsTree<any, any, any, any> ? Payload<Parameters<A[K]>[1]> : any

export type CommitParam<M> = M extends IMutationsTree<any> ? [MutationKey<M>, MutationPayload<M>?] : [string | number | symbol, any?]
export type DispatchParam<A> = A extends IActionsTree<any, any, any, any> ? [ActionKey<A>, ActionPayload<A>?] : [string | number | symbol, any?]

export type Getters<G> = G extends IGettersTree<any, any> ? { [K in keyof G]: ReturnType<G[K]> } : Record<string, any>
export type Mutations<M extends IMutationsTree<any>> = { [K in keyof M]: (payload: Payload<Parameters<M[K]>[1]>) => void }
export type Actions<A extends IActionsTree<any, any, any, any>> = { [K in keyof A]: (payload: Payload<Parameters<A[K]>[1]>) => ReturnType<A[K]> }

export type GetterHandler<S extends object, G extends IGettersTree<S, G>, R> = (state: S, getters: Getters<G>) => R
export type MutationHandler<S extends object, P extends [any?]> = (...args: [S, ...P]) => void
export type ActionHandler<C extends IActionContext<any, any, any, any>, P extends [any?], R> = (...args: [C, ...P]) => Promise<R>

export interface IGettersTree<S extends object, G extends IGettersTree<S, G>> {
  [x: string]: GetterHandler<S, G, any>
}

export interface IMutationsTree<S extends object> {
  [x: string]: MutationHandler<S, [any?]>
}

export interface IActionContext<S extends object, G extends IGettersTree<S, G>, M extends IMutationsTree<S>, A extends IActionsTree<S, G, M, A>> {
  state: S
  getters: Getters<G>
  commit (...args: CommitParam<M>): void
  dispatch (...args: DispatchParam<A>): ReturnType<A[typeof args[0]]>
}

export interface IActionsTree<S extends object, G extends IGettersTree<S, G>, M extends IMutationsTree<S>, A extends IActionsTree<S, G, M, A>> {
  [x: string]: ActionHandler<IActionContext<S, G, M, A>, [any?], any>
}

export interface IStoreBase<S extends object, G extends IGettersTree<S, G>> {
  state: S
  getters: Getters<G>
}

export interface IStore<S extends object, G extends IGettersTree<S, G>, M extends IMutationsTree<S>, A extends IActionsTree<S, G, M, A>> extends Readonly<IStoreBase<S, G>> {
  readonly mutations: Mutations<M>
  readonly actions: Actions<A>

  replaceState (state: S): void
  hotUpdate (options?: { getters?: G }): void
  commit (type: keyof M, payload: Payload<Parameters<M[typeof type]>[1]>): void
  dispatch (act: keyof A, payload:Payload< Parameters<A[typeof act]>[1]>): ReturnType<A[typeof act]>
  toJSON (): IStoreBase<S, G>
  toString (): string
}

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

  public constructor (state: S, getters?: G) {
    this.resetState(state, getters, false)
  }

  public resetState (state: S, getters?: G, hot?: boolean): void {
    this.getters = Object.create(null)
    const oldData = this.data
    const proxy: IObservedData<S> = reactive({ $$state: state }) as IObservedData<S>
    if (getters) {
      Object.keys(getters).forEach((key) => {
        let computedRef: ComputedRef<ReturnType<G[typeof key]>>
        Object.defineProperty(this.getters, key, {
          get: () => {
            if (!computedRef) {
              computedRef = computed(() => getters[key](proxy.$$state, this.getters))
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
}


export class Store<S extends object, G extends IGettersTree<S, G>, M extends IMutationsTree<S>, A extends IActionsTree<S, G, M, A>> implements IStore<S, G, M, A> {
  private readonly __impl!: StoreImpl<S, G>
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
      value: new StoreImpl(options.state, options.getters)
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
          options.mutations![key](this.state, payload)
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
          return options.actions![key](context, payload) as ReturnType<A[keyof typeof options.actions]>
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
      this.__impl.resetState(this.state, options.getters, true)
    }
  }

  public commit (type: keyof M, payload: Payload<Parameters<M[typeof type]>[1]>): void {
    if (typeof this.mutations[type] === 'function') {
      this.mutations[type](payload)
    } else {
      throw new Error('unknown mutation: ' + type)
    }
  }

  public dispatch (act: keyof A, payload: Payload<Parameters<A[typeof act]>[1]>): ReturnType<A[typeof act]> {
    if (typeof this.actions[act] === 'function') {
      return this.actions[act](payload)
    }
    return Promise.reject(new Error('unknown action: ' + act)) as ReturnType<A[typeof act]>
  }

  public toJSON (): IStoreBase<S, G> {
    return { state: this.state, getters: this.getters }
  }

  // @override
  public toString (): string {
    return JSON.stringify(this.toJSON())
  }
}
