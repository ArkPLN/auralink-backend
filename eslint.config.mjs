module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // 结合 Prettier
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    // 1. 允许使用 any 类型
    '@typescript-eslint/no-explicit-any': 'off',

    // 2. 允许使用 @ts-ignore, @ts-nocheck 等特殊注释
    '@typescript-eslint/ban-ts-comment': 'off',

    // 3. 允许定义了但未使用的变量 (可选)
    '@typescript-eslint/no-unused-vars': 'off',

    // 允许接口命名不以 I 开头 (NestJS 习惯)
    '@typescript-eslint/interface-name-prefix': 'off',
    
    // 允许显式指明函数返回类型 (NestJS 推荐，但也允许自动推导)
    '@typescript-eslint/explicit-function-return-type': 'off',
    
    // 允许显式指明模块边界类型
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};