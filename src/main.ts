// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Don't break userspace; keep entrypoint wiring explicit.
// Taste: Centralize global wiring (router/pinia/query/theme/icons) once.

import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query"
import { createPinia } from "pinia"
import piniaPluginPersistedstate from "pinia-plugin-persistedstate"
import { createApp } from "vue"

import { useAppColorMode } from "@/composables/useAppColorMode"
import { registerPermissionDirectives } from "@/directives/permission"
import "@/lib/iconify"

import App from "./App.vue"
import "./style.css"
import router from "./router"

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

useAppColorMode()

const app = createApp(App)
app.use(pinia).use(router).use(VueQueryPlugin, { queryClient })
registerPermissionDirectives(app)
app.mount("#app")
