<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #user-settings | Time: 2025-12-29T00:00:00+08:00
Principle: Keep settings small and predictable.
Taste: Calm placeholder until backend is ready.
-->

<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { useNotifyStore } from "@/stores/notify"

const notify = useNotifyStore()

function onResetPassword() {
  notify.info("功能待接入：重置密码")
}
</script>

<template>
  <div class="space-y-4">
    <div class="text-[13px] text-muted-foreground">账号设置建设中。</div>
    <Button type="button" variant="outline" class="h-11" @click="onResetPassword">重置密码</Button>
  </div>
</template>
