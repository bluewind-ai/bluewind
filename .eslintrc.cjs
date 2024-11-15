module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
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
  plugins: ["local", "unused-imports", "deprecation", "simple-import-sort"],

  overrides: [
    {
      files: ["*.js", "*.mjs", "*.ts", "*.tsx"],
      plugins: ["local"],
      rules: {
        "local/file-header": "error",
        "local/file-naming": "error",
        // "local/route-template-check": "error",
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
      plugins: ["react", "jsx-a11y", "local"],
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
      plugins: ["@typescript-eslint", "import", "local", "simple-import-sort"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
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
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/ban-ts-comment": "error",
        "deprecation/deprecation": "error",
        "simple-import-sort/imports": "error",
        "simple-import-sort/exports": "error",
        "import/first": "error",
        "import/newline-after-import": "error",
        "import/no-duplicates": "error",
        "local/no-table-literals": "error",
      },
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
    "@typescript-eslint/no-unused-vars": ["off", { argsIgnorePattern: "^_" }],
  },
};
