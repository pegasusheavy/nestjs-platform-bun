import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      // Require explicit accessibility modifiers on class members
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        {
          accessibility: "explicit",
          overrides: {
            constructors: "no-public", // Constructors don't need 'public' keyword
            accessors: "explicit",
            methods: "explicit",
            properties: "explicit",
            parameterProperties: "explicit",
          },
        },
      ],
      // Other recommended rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // Relaxed rules for test files
    files: ["src/**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/explicit-member-accessibility": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "benchmark/**", "*.js", "*.mjs"],
  }
);
