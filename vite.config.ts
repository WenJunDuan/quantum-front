import tailwindcss from "@tailwindcss/vite"
import vue from "@vitejs/plugin-vue"
import { fileURLToPath, URL } from "node:url"
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { defineConfig, loadEnv } from "vite"
import viteCompression from "vite-plugin-compression"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  const apiBaseUrl = env.VITE_API_BASE_URL
  const inferredProxyTarget =
    apiBaseUrl?.startsWith("http://") || apiBaseUrl?.startsWith("https://") ? apiBaseUrl : undefined
  const apiProxyTarget = env.VITE_API_PROXY_TARGET ?? inferredProxyTarget ?? "http://localhost:8080"

  return {
    esbuild: {
      drop: mode === "production" ? ["console", "debugger"] : [],
    },

    plugins: [
      vue(),

      AutoImport({
        dts: "src/types/auto-imports.d.ts",
        imports: ["vue", "vue-router", "pinia", "@vueuse/core"],
        dirs: ["src/composables", "src/hooks", "src/utils"],
        vueTemplate: true,
      }),

      Components({
        dts: "src/types/components.d.ts",
        dirs: ["src/components", "src/components/ui"],
        deep: true,
      }),

      tailwindcss(),

      viteCompression({
        verbose: true,
        disable: mode !== "production",
        threshold: 10_240,
        algorithm: "gzip",
        ext: ".gz",
      }),
    ],

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("src", import.meta.url)),
      },
    },

    server: {
      host: true,
      port: 3000,
      open: false,
      cors: true,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          configure(proxy) {
            proxy.on("proxyReq", (proxyReq, req) => {
              const auth = req.headers?.authorization
              if (typeof auth === "string" && auth.trim()) {
                proxyReq.setHeader("authorization", auth)
              }

              const refresh = (req.headers as Record<string, unknown> | undefined)?.[
                "x-refresh-token"
              ]
              if (typeof refresh === "string" && refresh.trim()) {
                proxyReq.setHeader("x-refresh-token", refresh)
              }
            })
          },
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },

    build: {
      target: "es2015",
      outDir: "dist",
      sourcemap: false,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
          manualChunks(id) {
            if (!id.includes("node_modules")) return

            if (id.includes("vue") || id.includes("pinia") || id.includes("vue-router")) {
              return "vendor-vue"
            }

            if (
              id.includes("reka-ui") ||
              id.includes("class-variance-authority") ||
              id.includes("clsx") ||
              id.includes("tailwind-merge") ||
              id.includes("@iconify")
            ) {
              return "vendor-ui"
            }

            return "vendor"
          },
        },
      },
      minify: "esbuild",
    },

    optimizeDeps: {
      include: [
        "@tanstack/vue-query",
        "@vueuse/core",
        "axios",
        "class-variance-authority",
        "clsx",
        "dayjs",
        "decimal.js",
        "pinia",
        "pinia-plugin-persistedstate",
        "query-string",
        "reka-ui",
        "tailwind-merge",
        "vue",
        "vue-router",
        "zod",
      ],
    },
  }
})
