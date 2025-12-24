/* {{RIPER-10 Action}}
 * Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
 * Principle: Tooling needs correct module boundaries.
 * Taste: One Vue SFC shim + typed env keeps DX boring.
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_APP_TITLE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "*.vue" {
  import type { DefineComponent } from "vue"
  const component: DefineComponent<{}, {}, unknown>
  export default component
}
