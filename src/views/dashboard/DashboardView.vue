<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #dashboard | Time: 2025-12-29T00:00:00+08:00
Principle: Dashboard is information hierarchy, not decoration.
Taste: Calm cards, subtle separators, and primary used sparingly.
-->

<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed } from "vue"

import AppIcon from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { useUserStore } from "@/stores/user"

const userStore = useUserStore()
const { profile } = storeToRefs(userStore)

const displayName = computed(() => profile.value?.nickname ?? profile.value?.username ?? "用户")

interface StatItem {
  label: string
  value: string
  change: string
  icon: string
}

const stats: StatItem[] = [
  { label: "活跃用户", value: "1,284", change: "+12.5%", icon: "radix-icons:person" },
  { label: "访问量", value: "32,910", change: "+8.2%", icon: "radix-icons:bar-chart" },
  { label: "转化率", value: "3.46%", change: "+0.3%", icon: "radix-icons:target" },
  { label: "错误率", value: "0.18%", change: "-0.06%", icon: "radix-icons:exclamation-triangle" },
]

const visitSeries = [120, 92, 108, 140, 132, 160, 172, 148, 156, 190, 178, 210, 198, 224]
const visitLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

interface ChartPaths {
  line: string
  area: string
  dots: { x: number; y: number }[]
}

function buildChart(values: number[], width = 520, height = 180, padding = 12): ChartPaths {
  const safeValues = values.length >= 2 ? values : [0, 0]
  const minValue = Math.min(...safeValues)
  const maxValue = Math.max(...safeValues)
  const range = Math.max(1, maxValue - minValue)

  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2
  const stepX = innerWidth / (safeValues.length - 1)

  const points = safeValues.map((value, index) => {
    const x = padding + index * stepX
    const ratio = (value - minValue) / range
    const y = padding + (1 - ratio) * innerHeight
    return { x, y }
  })

  const line = points
    .map((p, index) => `${index === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ")
  const area = `M ${points[0]!.x.toFixed(2)} ${(height - padding).toFixed(2)} ${points
    .map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ")} L ${points.at(-1)!.x.toFixed(2)} ${(height - padding).toFixed(2)} Z`

  return { line, area, dots: points }
}

const chart = computed(() => buildChart(visitSeries))
const totalVisits = computed(() => visitSeries.reduce((sum, value) => sum + value, 0))

interface ActivityRow {
  id: string
  time: string
  event: string
  actor: string
  status: "success" | "pending" | "failed"
}

const activity: ActivityRow[] = [
  { id: "evt-1", time: "09:12", event: "用户登录", actor: "admin", status: "success" },
  { id: "evt-2", time: "09:28", event: "创建角色", actor: "admin", status: "success" },
  { id: "evt-3", time: "10:01", event: "权限变更", actor: "ops", status: "pending" },
  { id: "evt-4", time: "10:22", event: "导出报表", actor: "analyst", status: "success" },
  { id: "evt-5", time: "10:37", event: "接口告警", actor: "system", status: "failed" },
  { id: "evt-6", time: "11:05", event: "更新配置", actor: "ops", status: "success" },
  { id: "evt-7", time: "11:26", event: "新增菜单", actor: "admin", status: "success" },
  { id: "evt-8", time: "11:48", event: "批量同步", actor: "system", status: "pending" },
]

function badgeClass(status: ActivityRow["status"]) {
  if (status === "success") return "bg-primary/10 text-primary"
  if (status === "pending") return "bg-muted text-muted-foreground"
  return "bg-destructive/10 text-destructive"
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <h2 class="text-xl font-semibold tracking-tight">Dashboard</h2>
        <p class="mt-1 text-[13px] text-muted-foreground">
          欢迎回来，{{ displayName }}。这里是你的关键指标概览。
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button type="button" variant="outline">
          <AppIcon icon="radix-icons:download" class="h-4 w-4" />
          导出
        </Button>
        <Button type="button">
          <AppIcon icon="radix-icons:plus" class="h-4 w-4" />
          新建
        </Button>
      </div>
    </header>

    <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="item in stats"
        :key="item.label"
        class="rounded-xl bg-background/60 p-4 ring-1 ring-foreground/5 transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-sm"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="text-[11px] font-semibold tracking-wide text-muted-foreground/80">
              {{ item.label }}
            </div>
          </div>
          <div class="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
            <AppIcon :icon="item.icon" class="h-4 w-4" />
          </div>
        </div>
        <div class="mt-2 text-2xl font-semibold tracking-tight">{{ item.value }}</div>
        <div class="mt-1 flex items-center gap-2 text-[12px] text-muted-foreground">
          <span :class="[item.change.startsWith('+') ? 'text-primary' : 'text-destructive']">{{
            item.change
          }}</span>
          <span>vs 7 days</span>
        </div>
      </div>
    </section>

    <section class="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <div class="rounded-xl bg-background/60 p-4 ring-1 ring-foreground/5">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="text-[13px] font-semibold tracking-tight">Visits</div>
            <div class="mt-1 text-[12px] text-muted-foreground">Last 14 days</div>
          </div>
          <div class="text-right">
            <div class="text-[11px] font-semibold tracking-wide text-muted-foreground/80">
              TOTAL
            </div>
            <div class="mt-1 text-lg font-semibold tracking-tight">
              {{ totalVisits.toLocaleString() }}
            </div>
          </div>
        </div>

        <div class="mt-4 overflow-hidden rounded-xl bg-background/40 p-3 ring-1 ring-foreground/5">
          <svg viewBox="0 0 520 180" class="h-40 w-full">
            <defs>
              <linearGradient id="visitArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="var(--primary)" stop-opacity="0.22" />
                <stop offset="1" stop-color="var(--primary)" stop-opacity="0.02" />
              </linearGradient>
            </defs>

            <path :d="chart.area" fill="url(#visitArea)" />
            <path
              :d="chart.line"
              fill="none"
              stroke="var(--primary)"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <circle
              v-for="(dot, index) in chart.dots"
              :key="index"
              :cx="dot.x"
              :cy="dot.y"
              r="3.5"
              fill="var(--primary)"
              fill-opacity="0.65"
            />
          </svg>

          <div class="mt-2 grid grid-cols-7 gap-1 text-[10px] text-muted-foreground">
            <div v-for="label in visitLabels" :key="label" class="text-center">{{ label }}</div>
          </div>
        </div>
      </div>

      <div class="rounded-xl bg-background/60 p-4 ring-1 ring-foreground/5">
        <div class="text-[13px] font-semibold tracking-tight">Top pages</div>
        <div class="mt-1 text-[12px] text-muted-foreground">Most visited routes (demo)</div>

        <div class="mt-4 space-y-3">
          <div
            class="flex items-center justify-between gap-3 rounded-xl bg-background/40 px-3 py-3 ring-1 ring-foreground/5"
          >
            <div class="min-w-0">
              <div class="truncate text-[13px] font-medium">/</div>
              <div class="mt-0.5 text-[11px] text-muted-foreground">Dashboard</div>
            </div>
            <div class="text-[12px] font-semibold">12,410</div>
          </div>

          <div
            class="flex items-center justify-between gap-3 rounded-xl bg-background/40 px-3 py-3 ring-1 ring-foreground/5"
          >
            <div class="min-w-0">
              <div class="truncate text-[13px] font-medium">/system/users</div>
              <div class="mt-0.5 text-[11px] text-muted-foreground">用户管理</div>
            </div>
            <div class="text-[12px] font-semibold">8,204</div>
          </div>

          <div
            class="flex items-center justify-between gap-3 rounded-xl bg-background/40 px-3 py-3 ring-1 ring-foreground/5"
          >
            <div class="min-w-0">
              <div class="truncate text-[13px] font-medium">/system/roles</div>
              <div class="mt-0.5 text-[11px] text-muted-foreground">角色管理</div>
            </div>
            <div class="text-[12px] font-semibold">6,119</div>
          </div>
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-xl bg-background/60 ring-1 ring-foreground/5">
      <div class="flex items-center justify-between gap-3 px-4 py-3">
        <div class="min-w-0">
          <div class="text-[13px] font-semibold tracking-tight">Recent activity</div>
          <div class="mt-0.5 text-[12px] text-muted-foreground">Latest events (demo)</div>
        </div>
      </div>

      <div class="overflow-auto">
        <table class="w-full min-w-[44rem] text-left text-[13px]">
          <thead
            class="bg-background/40 text-[11px] font-semibold tracking-wide text-muted-foreground/80"
          >
            <tr>
              <th class="px-4 py-3">Time</th>
              <th class="px-4 py-3">Event</th>
              <th class="px-4 py-3">Actor</th>
              <th class="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-foreground/5">
            <tr v-for="row in activity" :key="row.id" class="hover:bg-background/30">
              <td class="px-4 py-3 font-mono text-[12px] text-muted-foreground">{{ row.time }}</td>
              <td class="px-4 py-3 font-medium">{{ row.event }}</td>
              <td class="px-4 py-3 text-muted-foreground">{{ row.actor }}</td>
              <td class="px-4 py-3 text-right">
                <span
                  class="inline-flex h-7 items-center rounded-full px-3 text-[12px] font-medium"
                  :class="badgeClass(row.status)"
                >
                  {{ row.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
