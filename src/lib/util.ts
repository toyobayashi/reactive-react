import type { Ref } from "@vue/reactivity"

export function deref <T>(ref: Ref<T>): T {
  return ref.value
}
