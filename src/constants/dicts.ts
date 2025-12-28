// {{RIPER-10 Action}}
// Role: LD | Task_ID: #dx-dicts | Time: 2025-12-28T00:00:00+08:00
// Principle: No magic numbers in views; centralize value→UI mapping.
// Taste: Typed dict builder with duplicate protection.

export type DictValue = string | number

export type DictItem<V extends DictValue = DictValue> = Readonly<{
  value: V
  label: string
  variant?: "default" | "secondary" | "destructive" | "outline"
}>

export function defineDict<const Items extends readonly DictItem[]>(items: Items) {
  type V = Items[number]["value"]
  type I = Items[number]

  const map = new Map<V, I>()
  for (const item of items) {
    if (map.has(item.value)) {
      throw new Error(`[Dict] Duplicate value: ${String(item.value)}`)
    }
    map.set(item.value, item)
  }

  return { items, map } as const
}

export function dictLabel<V extends DictValue>(
  dict: { map: Map<V, { label: string }> },
  value: V | null | undefined,
  fallback = "-",
) {
  if (value === null || value === undefined) return fallback
  return dict.map.get(value)?.label ?? fallback
}
