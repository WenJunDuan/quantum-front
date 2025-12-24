// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Stores model data, not UI.
// Taste: Keep state minimal and mutation explicit.

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
