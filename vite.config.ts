import { defineConfig, lazyPlugins } from 'vite-plus'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    trailingComma: 'all',
    semi: false,
    singleQuote: true,
  },
  lint: {
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
      'typescript/no-floating-promises': 'allow',
      'typescript/no-useless-default-assignment': 'off',
      'no-unused-vars': [
        'error',
        {
          fix: {
            imports: 'safe-fix',
          },
        },
      ],
    },
    options: { typeAware: true, typeCheck: true },
  },
  plugins: lazyPlugins(() => [react(), tailwindcss()]),
  resolve: {
    alias: {
      src: '/src',
    },
  },
  clearScreen: false,
  server: {
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
})
