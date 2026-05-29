import js from '@eslint/js'
import vue from 'eslint-plugin-vue'

const globals = {
  cancelAnimationFrame: 'readonly',
  clearInterval: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  crypto: 'readonly',
  document: 'readonly',
  localStorage: 'readonly',
  navigator: 'readonly',
  process: 'readonly',
  requestAnimationFrame: 'readonly',
  setInterval: 'readonly',
  setTimeout: 'readonly',
  window: 'readonly',
}

export default [
  { ignores: ['.eslintrc.cjs', 'dist/**', 'node_modules/**', 'test-results/**'] },
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals,
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/html-indent': 'off',
      'vue/html-self-closing': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
]
