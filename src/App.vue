<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
Principle: Keep app shell simple; route content drives complexity.
Taste: A minimal layout; views own their UI.
-->

<script setup lang="ts">
import { RouterView } from "vue-router"

import { Toaster } from "@/components/ui/sonner"
</script>

<template>
  <div class="min-h-dvh bg-background text-foreground">
    <RouterView />
    <Toaster />
  </div>
</template>
