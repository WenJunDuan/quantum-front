<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
Principle: Showcase primitives, not magic.
Taste: One page demonstrating router/pinia/ui/theme/utilities.
-->

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { RouterLink } from "vue-router"

import AppIcon from "@/components/AppIcon.vue"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { appConfig } from "@/config/app"
import { useAuth } from "@/hooks/useAuth"
import { useCounterStore } from "@/stores/counter"
import { formatDateTime } from "@/utils/date"

const counter = useCounterStore()
const { accessToken, isAuthed, logout, setToken } = useAuth()

const name = ref("")
const greeting = computed(() => {
  if (name.value) return `Hello, ${name.value}`
  return "Hello"
})

const tokenDraft = ref("")
watch(
  accessToken,
  (token) => {
    tokenDraft.value = token ?? ""
  },
  { immediate: true },
)

const authStatus = computed(() => {
  if (isAuthed.value) return "Authed"
  return "Guest"
})

function saveToken() {
  const token = tokenDraft.value.trim()
  if (token) setToken(token)
  else setToken(null)
}
</script>

<template>
  <main class="mx-auto max-w-5xl p-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Enterprise Vue Starter</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Vite · Vue 3 · Pinia · Router · Tailwind v4 · shadcn-vue-style
        </p>
      </div>

      <Button as-child variant="outline">
        <RouterLink to="/about">
          About
          <AppIcon icon="hugeicons:arrow-right-01" class="size-4" />
        </RouterLink>
      </Button>
    </div>

    <Separator class="my-6" />

    <div class="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <AppIcon icon="hugeicons:sparkles" class="size-5" />
            Counter
          </CardTitle>
          <CardDescription>Pinia store example.</CardDescription>
        </CardHeader>

        <CardContent class="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" @click="counter.decrement()"> - </Button>
          <Button size="sm" @click="counter.increment()"> Count: {{ counter.count }} </Button>
          <Button size="sm" variant="outline" @click="counter.reset()"> Reset </Button>
        </CardContent>

        <CardFooter class="text-sm text-muted-foreground">
          Replace this with your real domain modules.
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form</CardTitle>
          <CardDescription>A tiny form example using shadcn-vue input components.</CardDescription>
        </CardHeader>

        <CardContent class="grid gap-4">
          <div class="grid gap-2">
            <Label for="starter-name">Name</Label>
            <Input id="starter-name" v-model="name" placeholder="Type something" />
          </div>

          <p class="text-sm text-muted-foreground">
            {{ greeting }}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Config</CardTitle>
          <CardDescription>Vite env → appConfig (typed).</CardDescription>
        </CardHeader>
        <CardContent class="space-y-2 text-sm text-muted-foreground">
          <div class="flex items-center justify-between gap-3">
            <span>API Base</span>
            <code class="rounded bg-muted px-2 py-1 text-xs text-foreground">
              {{ appConfig.apiBaseUrl }}
            </code>
          </div>
          <div class="flex items-center justify-between gap-3">
            <span>Now</span>
            <span class="font-mono text-xs text-foreground">
              {{ formatDateTime(new Date()) }}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auth (persisted)</CardTitle>
          <CardDescription>Pinia persistedstate demo.</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-3">
          <div class="grid gap-2">
            <Label for="starter-token">Access token</Label>
            <Input
              id="starter-token"
              v-model="tokenDraft"
              placeholder="Paste token..."
              autocomplete="off"
            />
          </div>

          <div class="flex items-center gap-2">
            <Button size="sm" @click="saveToken"> Save </Button>
            <Button size="sm" variant="outline" @click="logout()"> Clear </Button>
            <span class="ml-auto text-xs text-muted-foreground"> Status: {{ authStatus }} </span>
          </div>
        </CardContent>
      </Card>
    </div>
  </main>
</template>
