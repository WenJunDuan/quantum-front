import { defineStore } from "pinia"
import { ref } from "vue"

export const useCounterStore = defineStore("counter", () => {
  const count = ref(0)

  function increment() {
    count.value += 1
  }

  function decrement() {
    count.value -= 1
  }

  function reset() {
    count.value = 0
  }

  return { count, decrement, increment, reset }
})
