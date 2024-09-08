<script setup>
import { ref } from 'vue'
import useUserInfoStore from '@/stores/userInfo.js'
import { userInfoUpdateService, userPasswordUpdateService } from '@/api/user.js'
import { ElMessage } from 'element-plus'

const userInfoStore = useUserInfoStore();

const userInfo = ref({ ...userInfoStore.info })

const updatePasswordModel = ref({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
})

//默认显示标签
const activeName = ref('first')






//修改个人信息
const handleUpdateUserInfo = async () => {
    //调用接口
    let result = await userInfoUpdateService(userInfo.value);
    ElMessage.success(result.msg ? result.msg : '修改成功');

    //修改pinia中的个人信息
    userInfoStore.setInfo(userInfo.value)
}

//修改密码
const handleUpdatePassword = async () => {

    // 封装请求体
    const requestBody = {
        oldPassword: updatePasswordModel.value.oldPassword,
        newPassword: updatePasswordModel.value.newPassword,
        confirmPassword: updatePasswordModel.value.confirmPassword
    };

    //调用接口
    let result = await userPasswordUpdateService(requestBody);
    ElMessage.success(result.msg ? result.msg : '修改成功');

}



const newPasswordValidate = (rule, value, callback) => {
    if (value === updatePasswordModel.value.oldPassword) {
        callback(new Error('新密码不能与旧密码一致'));
    } else {
        callback();
    }
}

const confirmPasswordValidate = (rule, value, callback) => {
    if (value === updatePasswordModel.value.newPassword) {
        callback(new Error('两次输入密码不一致!'));
    } else {
        callback();
    }
}

const userInfoRules = {
    nickname: [
        { required: true, message: '请输入用户昵称', trigger: 'blur' },
        {
            pattern: /^\S{5,16}$/,
            message: '昵称必须是5-16位的非空字符',
            trigger: 'blur'
        }
    ],
}

const updatePasswordRules = {

    oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }

    ],
    newPassword: [
        { required: true, message: '新密码不能为空', trigger: 'blur' },
        {
            min: 5,
            max: 16,
            message: '长度必须是5-16位的非空字符',
            trigger: 'blur'
        },
        { validator: newPasswordValidate, trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请再输入一遍新密码', trigger: 'blur' },
        { validator: confirmPasswordValidate, trigger: 'blur' }
    ]
}

</script>
<template>
    <el-card class="page-container">
        <template #header>
            <div class="header">
                <span>基本资料</span>
            </div>
        </template>
        <el-tabs v-model="activeName">
            <el-tab-pane label="个人信息" name="first">
                <el-row>
                    <el-col :span="12">
                        <el-form :model="userInfo" :rules="userInfoRules" label-width="100px" size="large">
                            <el-form-item label="用户名">
                                <el-input v-model="userInfo.username" disabled></el-input>
                            </el-form-item>
                            <el-form-item label="用户昵称" prop="nickname">
                                <el-input v-model="userInfo.nickname"></el-input>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" @click="handleUpdateUserInfo">提交修改</el-button>
                            </el-form-item>
                        </el-form>
                    </el-col>
                </el-row>
            </el-tab-pane>
            <el-tab-pane label="修改密码" name="second">
                <el-form :model="updatePasswordModel" :rules="updatePasswordRules" label-width="100px" size="large">
                    <el-form-item label="原密码">
                        <el-input v-model="updatePasswordModel.oldPassword" prop="oldPossword" type="password"></el-input>
                    </el-form-item>
                    <el-form-item label="新密码" prop="newPossword">
                        <el-input v-model="updatePasswordModel.newPassword" type="password"></el-input>
                    </el-form-item>
                    <el-form-item label="确认新密码" prop="confirmPossword">
                        <el-input v-model="updatePasswordModel.confirmPassword" type="password"></el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="handleUpdatePassword">提交修改</el-button>
                    </el-form-item>
                </el-form>
            </el-tab-pane>
        </el-tabs>

    </el-card>
</template>