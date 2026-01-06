<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #user-settings | Time: 2025-12-29T00:00:00+08:00
File: src/views/system/user/AccountView.vue
Principle: Keep settings small and predictable.
Taste: Calm placeholder until backend is ready.
-->

<script setup lang="ts">
import { toast } from "vue-sonner"

import { Button } from "@/components/ui/button"

function onResetPassword() {
  toast.info("功能待接入：重置密码")
}
</script>

<template>
  <div class="space-y-4">
    <div class="text-[13px] text-muted-foreground">账号设置建设中。</div>
    <Button type="button" variant="outline" @click="onResetPassword">重置密码</Button>
  </div>
</template>
