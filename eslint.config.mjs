import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      curly: "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "react/jsx-no-useless-fragment": ["warn", { allowExpressions: true }],
      "react/function-component-definition": [
        "warn",
        { namedComponents: "arrow-function", unnamedComponents: "arrow-function" },
      ],
    },
  },
];

export default eslintConfig;
