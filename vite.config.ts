import { defineConfig } from 'vite';

export default defineConfig({
  // 相対パスでビルドし、GitHub Pages などのサブディレクトリにも置けるようにする
  base: './',
});
