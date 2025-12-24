<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
Principle: Keep docs close to code; avoid tribal knowledge.
Taste: A small "what's included" page for onboarding.
-->

<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
</script>

<template>
  <main class="mx-auto max-w-5xl p-6">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold tracking-tight">About</h1>
      <Button as-child variant="outline">
        <a
          href="https://www.shadcn-vue.com/docs/installation/vite"
          target="_blank"
          rel="noreferrer"
        >
          shadcn-vue docs
        </a>
      </Button>
    </div>

    <div class="mt-6 grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Installed</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2 text-sm text-muted-foreground">
          <ul class="list-disc pl-5">
            <li>Vue 3 + Vite</li>
            <li>Vue Router + Pinia</li>
            <li>Tailwind CSS v4 + shadcn-vue-style components</li>
            <li>Axios + TanStack Query</li>
            <li>Zod + Day.js</li>
            <li>pinia-plugin-persistedstate</li>
            <li>query-string + decimal.js</li>
            <li>Iconify (Hugeicons + Radix Icons)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </main>
</template>
