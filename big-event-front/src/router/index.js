import { createRouter, createWebHistory } from 'vue-router'

//导入组件
import LoginVue from '@/views/Login.vue'
import LayoutVue from '@/views/Layout.vue'
import AudioManageVue from '@/views/audio/AudioManage.vue'
import UserInfoVue from '@/views/user/UserInfo.vue'
import indexVue from '@/views/index/index.vue'

//定义路由关系
const routes = [
    { path: '/login', component: LoginVue },
    {
        path: '/', component: LayoutVue,redirect:'/login', children: [
            { path: '/audio/manage', component: AudioManageVue },
            { path: '/user/info', component: UserInfoVue },
            { path: '/index', component: indexVue}
        ]
    }
]

//创建路由器
const router = createRouter({
    history: createWebHistory(),
    routes: routes
})

//导出路由
export default router
