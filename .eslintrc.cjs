// .eslintrc.cjs

module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  ignorePatterns: [
    "!**/.server",
    "!**/.client",
    "website/**",
    "eslint-plugin-local/**",
    ".eslintrc.cjs",
  ],

  extends: ["eslint:recommended"],
  plugins: ["local", "unused-imports"],

  overrides: [
    {
      files: ["*.js", "*.mjs", "*.ts", "*.tsx"],
      rules: {
        "local/file-header": "error",
        "local/file-naming": "error",
        "unused-imports/no-unused-imports": "error",
        "unused-imports/no-unused-vars": [
          "warn",
          { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
        ],
      },
    },
    {
      files: ["eslint-plugin-local/**/*.js", "tailwind.config.ts"],
      rules: {
        "@typescript-eslint/no-require-imports": "off",
        "local/file-header": "off",
        "local/file-naming": "off",
      },
    },

    {
      files: ["**/*.{js,jsx,ts,tsx}"],
      plugins: ["react", "jsx-a11y"],
      extends: [
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "plugin:react-hooks/recommended",
        "plugin:jsx-a11y/recommended",
      ],
      settings: {
        react: {
          version: "detect",
        },
        formComponents: ["Form"],
        linkComponents: [
          { name: "Link", linkAttribute: "to" },
          { name: "NavLink", linkAttribute: "to" },
        ],
        "import/resolver": {
          typescript: {},
        },
      },
    },

    {
      files: ["**/*.{ts,tsx}"],
      plugins: ["@typescript-eslint", "import"],
      parser: "@typescript-eslint/parser",
      settings: {
        "import/internal-regex": "^~/",
        "import/resolver": {
          node: {
            extensions: [".ts", ".tsx"],
          },
          typescript: {
            alwaysTryTypes: true,
          },
        },
      },
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:import/recommended",
        "plugin:import/typescript",
      ],
    },

    {
      files: [".eslintrc.js"],
      env: {
        node: true,
      },
    },
  ],
  rules: {
    "local/file-header": "error",
    "local/file-naming": "error",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
};
