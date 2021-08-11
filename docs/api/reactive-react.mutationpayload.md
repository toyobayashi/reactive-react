<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@tybys/reactive-react](./reactive-react.md) &gt; [MutationPayload](./reactive-react.mutationpayload.md)

## MutationPayload type


<b>Signature:</b>

```typescript
export declare type MutationPayload<M, K extends keyof M = keyof M> = M extends MutationsTree<any> ? Payload<SecondParam<M, K>> : any;
```
<b>References:</b> [MutationsTree](./reactive-react.mutationstree.md)<!-- -->, [Payload](./reactive-react.payload.md)<!-- -->, [SecondParam](./reactive-react.secondparam.md)
