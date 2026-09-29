// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**"] },
  eslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        project: ["tsconfig.frontend.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
