// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Defaults first; config only for deltas.
// Taste: Keep Tailwind config minimal for tooling/CLI compatibility.

import type { Config } from "tailwindcss"

export default {
  content: ["./index.html", "./src/**/*.{vue,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
