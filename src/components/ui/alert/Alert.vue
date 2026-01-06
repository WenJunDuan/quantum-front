<!--
  Alert 组件 - shadcn-vue 官方规范
-->

<script setup lang="ts">
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const props = defineProps<AlertProps>()

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

type AlertProps = VariantProps<typeof alertVariants> & { class?: string }
</script>

<template>
  <div :class="cn(alertVariants({ variant: props.variant }), props.class)" role="alert">
    <slot />
  </div>
</template>
