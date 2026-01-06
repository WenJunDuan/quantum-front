/** @type {import("prettier").Config} */
module.exports = {
  semi: false,
  singleQuote: false,
  trailingComma: "all",
  endOfLine: "auto",

  // --- 生产环境增强 ---
  printWidth: 100, // 稍微放宽单行长度，减少 Shadcn 组件标签过度折行
  tabWidth: 2,
  useTabs: false,

  // --- 插件配置 ---
  plugins: ["prettier-plugin-tailwindcss"],

  // Tailwind v4：需要显式指定 CSS 入口文件（包含 @import "tailwindcss" / @theme / @plugin 等）
  tailwindStylesheet: "./src/style.css",
  tailwindAttributes: ["class", "className", ".*Class"], // 支持 shadcn 动态类名
}
