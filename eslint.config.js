// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Make tooling boring and deterministic.
// Taste: Use `typescript-eslint` single package; keep config minimal and working.

import js from "@eslint/js"
import perfectionist from "eslint-plugin-perfectionist"
import unicorn from "eslint-plugin-unicorn"
import unusedImports from "eslint-plugin-unused-imports"
import vue from "eslint-plugin-vue"
import globals from "globals"
import tseslint from "typescript-eslint"
import vueParser from "vue-eslint-parser"
import configPrettier from "eslint-config-prettier"

export default tseslint.config(
  {
    ignores: [
      "*.config.js",
      "*.config.cjs",
      "dist/",
      "node_modules/",
      "src/types/auto-imports.d.ts",
      "src/types/components.d.ts",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  ...vue.configs["flat/recommended"],

  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      parserOptions: {
        extraFileExtensions: [".vue"],
        sourceType: "module",
      },
    },
  },

  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        sourceType: "module",
      },
    },
  },

  {
    plugins: {
      perfectionist,
      "unused-imports": unusedImports,
      unicorn,
    },
    rules: {
      ...unicorn.configs.recommended.rules,
      "unicorn/filename-case": "off",
      "unicorn/prevent-abbreviations": "off",
      "unicorn/no-null": "off",

      "perfectionist/sort-imports": [
        "warn",
        {
          groups: [
            "type",
            ["builtin", "external"],
            "internal",
            "parent",
            "sibling",
            "index",
            "unknown",
          ],
        },
      ],

      "unused-imports/no-unused-imports": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",

      "vue/multi-word-component-names": "off",
      "vue/block-lang": ["error", { script: { lang: "ts" } }],
      "vue/define-macros-order": ["error", { order: ["defineProps", "defineEmits"] }],
      "vue/html-self-closing": [
        "error",
        { html: { void: "always", normal: "always", component: "always" } },
      ],

      "no-console": "off",
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },

  {
    files: ["src/components/ui/**/*.vue"],
    rules: {
      "vue/require-default-prop": "off",
    },
  },

  configPrettier,
)
