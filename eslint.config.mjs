import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    // Match the source surface the previous `next lint` covered. Node scripts,
    // build config, and native shells are intentionally excluded.
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "scripts/**",
      "ios/**",
      "www/**",
      "*.config.mjs",
      "*.config.js",
    ],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // React Compiler-aware rules newly promoted to errors by
      // eslint-plugin-react-hooks v6 (pulled in via eslint-config-next 16).
      // They are advisory here (and misfire on async Server Components), so we
      // surface them as warnings rather than failing the build on patterns the
      // pre-upgrade baseline already accepted.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
];

export default eslintConfig;
