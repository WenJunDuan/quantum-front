// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Ship icons as data, not network requests.
// Taste: Preload the small Radix set; keep other sets on-demand.

import radixIcons from "@iconify-json/radix-icons/icons.json"
import { addCollection } from "@iconify/vue"

addCollection(radixIcons)
