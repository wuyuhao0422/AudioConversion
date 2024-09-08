import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
  ,
  server:{
    proxy:{
      '/api':{//获取路径中包含了/api的请求
          target:'http://localhost:8080',//后台服务所在的源
          changeOrigin:true,//修改源
          rewrite:(path)=>path.replace(/^\/api/,'')///api替换为''
      },
      '/oss': { // 处理访问OSS的请求
        target: 'https://audio-conversion-yhwu.oss-cn-beijing.aliyuncs.com', // 阿里云OSS地址
        changeOrigin: true, // 允许跨域
        rewrite: (path) => path.replace(/^\/oss/, '') // 将/oss替换为空
      }
    }
  }
})
