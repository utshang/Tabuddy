import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // react-hook-form 的 `handleSubmit(fn)` 回傳的是延後到送出事件才執行的 handler，
      // 但這條規則會誤判成 render 期間讀取 ref（fn 內部若碰到任何 ref.current）。
      // 已知的 false positive，專案內所有表單皆採用 handleSubmit 這個寫法。
      "react-hooks/refs": "off",
    },
  },
]);

export default eslintConfig;
