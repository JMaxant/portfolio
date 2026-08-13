import js from "@eslint/js";
import globals from "globals";
import {defineConfig} from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: {js},
    extends: ["js/recommended"],
    languageOptions: {globals: globals.browser}
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        document: "readonly",
        localStorage: "readonly",
      }
    },
    rules: {
      "no-unused-vars": ["error", {argsIgnorePattern: "^_"}],
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
    },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      sourceType: "module",
      globals: globals.node,
    },
  },
]);
