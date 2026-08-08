import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "migrations/**"] },
  ...coreWebVitals,
  ...typescript,
  {
    // Node scripts and the Tailwind v3 config are CommonJS, where require() is the only option.
    files: ["scripts/**/*.js", "tailwind.config.ts"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default eslintConfig;
