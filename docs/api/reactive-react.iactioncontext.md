<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@tybys/reactive-react](./reactive-react.md) &gt; [IActionContext](./reactive-react.iactioncontext.md)

## IActionContext interface


<b>Signature:</b>

```typescript
export interface IActionContext<S extends object, G extends GettersTree<S, G>, M extends MutationsTree<S>, A extends ActionsTree<S, G, M, A>> 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [getters](./reactive-react.iactioncontext.getters.md) | [Getters](./reactive-react.getters.md)<!-- -->&lt;G&gt; |  |
|  [state](./reactive-react.iactioncontext.state.md) | S |  |

## Methods

|  Method | Description |
|  --- | --- |
|  [commit(type, payload)](./reactive-react.iactioncontext.commit.md) |  |
|  [dispatch(act, payload)](./reactive-react.iactioncontext.dispatch.md) |  |

