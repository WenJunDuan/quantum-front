<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
Principle: Labels are semantic, not decorative.
Taste: Minimal wrapper with shadcn-friendly classes.
-->

<template>
  <label
    class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    <slot />
  </label>
</template>
