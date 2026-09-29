// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**"] },
  eslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        project: ["tsconfig.backend.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
