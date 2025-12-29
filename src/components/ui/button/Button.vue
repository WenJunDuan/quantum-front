<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
Principle: A good component has a small surface area.
Taste: Variants are data (CVA), and `asChild` is handled safely.
-->

<script lang="ts">
import type { PropType } from "vue"

import { cva } from "class-variance-authority"
import { cloneVNode, defineComponent, h, isVNode, type Component } from "vue"

import { cn } from "@/lib/utils"

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
type ButtonSize = "default" | "sm" | "lg" | "icon"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[13px] font-medium tracking-tight transition-[transform,background-color,color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-11 px-3 text-[12px]",
        lg: "h-12 px-6 text-sm",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export default defineComponent({
  name: "UiButton",
  inheritAttrs: false,
  props: {
    as: { type: [String, Object] as PropType<string | Component>, default: "button" },
    asChild: { type: Boolean, default: false },
    variant: { type: String as PropType<ButtonVariant>, default: "default" },
    size: { type: String as PropType<ButtonSize>, default: "default" },
  },
  setup(props, { slots, attrs }) {
    return () => {
      const className = cn(
        buttonVariants({ variant: props.variant, size: props.size }),
        attrs.class,
      )

      if (props.asChild) {
        const vnode = slots.default?.()[0]
        if (!vnode || !isVNode(vnode)) return null

        return cloneVNode(vnode, {
          ...attrs,
          class: cn(className, vnode.props?.class),
        })
      }

      return h(
        props.as,
        {
          ...attrs,
          class: className,
        },
        slots.default?.(),
      )
    }
  },
})
</script>
