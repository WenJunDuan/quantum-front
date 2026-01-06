import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query"
import { createPinia } from "pinia"
import { createApp } from "vue"

import { useAppColorMode } from "@/composables/useAppColorMode"
import { useThemeColor } from "@/composables/useThemeColor"
import { registerPermissionDirectives } from "@/directives/permission"
import "@/lib/iconify"

import "vue-sonner/style.css"

import App from "./App.vue"
import router from "./router"
import "./style.css"

const pinia = createPinia()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

useAppColorMode()
useThemeColor()

const app = createApp(App)
app.use(pinia).use(router).use(VueQueryPlugin, { queryClient })
registerPermissionDirectives(app)
app.mount("#app")
