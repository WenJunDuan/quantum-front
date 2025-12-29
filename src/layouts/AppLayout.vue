<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #layout-split | Time: 2025-12-29T00:00:00+08:00
Principle: Layout owns shell; pages own content.
Taste: Compose layout from small focused parts.
-->

<script setup lang="ts">
import { storeToRefs } from "pinia"
import { onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"

import AppLayoutHeader from "@/layouts/components/AppLayoutHeader.vue"
import AppLayoutMain from "@/layouts/components/AppLayoutMain.vue"
import AppLayoutSidebar from "@/layouts/components/AppLayoutSidebar.vue"
import { useUserStore } from "@/stores/user"

const route = useRoute()
const userStore = useUserStore()
const { routers } = storeToRefs(userStore)

const isSidebarOpen = ref(false)
const isSidebarCollapsed = ref(false)

const SIDEBAR_COLLAPSE_KEY = "quantum:sidebar:collapsed"

function openSidebar() {
  isSidebarOpen.value = true
}

function closeSidebar() {
  isSidebarOpen.value = false
}

function toggleSidebarCollapsed() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

watch(
  () => route.fullPath,
  () => {
    isSidebarOpen.value = false
  },
)

onMounted(() => {
  const savedSidebar = localStorage.getItem(SIDEBAR_COLLAPSE_KEY)
  if (savedSidebar === "1") isSidebarCollapsed.value = true
})

watch(isSidebarCollapsed, (value) => {
  localStorage.setItem(SIDEBAR_COLLAPSE_KEY, value ? "1" : "0")
})
</script>

<template>
  <div class="h-dvh min-h-dvh bg-background text-foreground">
    <div class="relative flex h-full w-full overflow-hidden bg-background">
      <div
        v-show="isSidebarOpen"
        class="absolute inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
        @click="closeSidebar"
      />

      <AppLayoutSidebar
        :is-open="isSidebarOpen"
        :is-collapsed="isSidebarCollapsed"
        :routers="routers"
        @close="closeSidebar"
      />

      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppLayoutHeader
          :is-sidebar-collapsed="isSidebarCollapsed"
          @open-sidebar="openSidebar"
          @toggle-sidebar-collapsed="toggleSidebarCollapsed"
        />
        <AppLayoutMain />
      </div>
    </div>
  </div>
</template>
