import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  define: {
    __VUE_OPTIONS_API__: false,
  },
  build: {
    lib: {
      entry: ['./esm.ts'],
      formats: ['es'],
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['vue', 'vue-demi'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue',
        },
      },
    },
    minify: false,
  },
  optimizeDeps: {
    exclude: [
      'vue-demi',
    ],
  },
});
