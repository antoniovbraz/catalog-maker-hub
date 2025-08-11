import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import tailwindcss from "eslint-plugin-tailwindcss";
import localPlugin from "./eslint/rules/no-outside-ui-imports.js";
import react from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
      ...tailwindcss.configs["flat/recommended"],
      eslintConfigPrettier,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      react,
      "jsx-a11y": jsxA11y,
      import: importPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      tailwindcss,
      local: localPlugin,
      prettier,
    },
    settings: {
      tailwindcss: {
        config: "tailwind.config.ts",
      },
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_|React",
          caughtErrors: "none",
          ignoreRestSiblings: true,
        },
      ],
      "tailwindcss/no-custom-classname": "off",
      "local/no-outside-ui-imports": "error",
      "import/order": "warn",
      "import/no-unresolved": "off",
      "react/display-name": "off",
      "react/prop-types": "off",
      "import/named": "off",
      "import/no-named-as-default": "off",
      "import/no-named-as-default-member": "off",
      "import/no-duplicates": "off",
      "import/default": "off",
      "import/export": "off",
      "react/no-unescaped-entities": "off",
      "jsx-a11y/no-autofocus": "off",
      "jsx-a11y/heading-has-content": "off",
      "react/no-unknown-property": "off",
      "jsx-a11y/anchor-has-content": "off",
      "prettier/prettier": "error",
    },
  }
);
