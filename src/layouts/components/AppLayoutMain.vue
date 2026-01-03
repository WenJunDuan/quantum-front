<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #layout-split | Time: 2025-12-29T00:00:00+08:00
Principle: Layout is composition; keep pieces small.
Taste: Main provides Apple-like canvas + content card.
-->

<script setup lang="ts">
import { RouterView } from "vue-router"

import { useTabsStore } from "@/stores/tabs"

const tabsStore = useTabsStore()
</script>

<template>
  <main
    class="min-h-0 flex-1 overflow-auto bg-background p-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  >
    <div class="min-h-full rounded-xl bg-card p-4">
      <RouterView v-slot="{ Component, route: viewRoute }">
        <component
          :is="Component"
          v-if="viewRoute.meta.noCache === true"
          :key="`${viewRoute.fullPath}:${tabsStore.getRefreshKey(viewRoute.fullPath)}`"
        />
        <KeepAlive v-else :max="20">
          <component
            :is="Component"
            :key="`${viewRoute.fullPath}:${tabsStore.getRefreshKey(viewRoute.fullPath)}`"
          />
        </KeepAlive>
      </RouterView>
    </div>
  </main>
</template>
