import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * pdf-lib 的 ESM bundle 内嵌了 pako 的 C 风格条件编译注释（//#ifdef、//#endif 等）。
 * uni-app 的 preprocess 库用 xregexp.matchrecursive 扫描注释分隔符时，
 * 遇到孤立的 #endif（没有对应的 #ifdef）抛出 "Unbalanced delimiter found in string"。
 *
 * 使用虚拟模块在 resolveId + load 阶段完全拦截 pdf-lib 的解析，
 * 加载时先清除所有 C 风格条件编译注释，再交给后续插件处理。
 */
function patchPdfLib() {
  const VIRTUAL_ID = '\0pdf-lib-patched'
  const bundlePath = resolve(__dirname, 'node_modules/pdf-lib/dist/pdf-lib.esm.js')

  return {
    name: 'patch-pdf-lib',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'pdf-lib') return VIRTUAL_ID
    },
    load(id) {
      if (id !== VIRTUAL_ID) return null
      const raw = readFileSync(bundlePath, 'utf-8')
      const code = raw
        .replace(/\/\/#ifdef\b[^\n]*/g, '//')
        .replace(/\/\/#ifndef\b[^\n]*/g, '//')
        .replace(/\/\/#endif\b[^\n]*/g, '//')
        .replace(/\/\*#ifdef[\s\S]*?#endif\*\//g, '/* */')
        .replace(/\/\*#ifndef[\s\S]*?#endif\*\//g, '/* */')
      return { code, map: null }
    },
  }
}

export default defineConfig({
  plugins: [patchPdfLib(), uni()],
})
