<script setup>
import { Edit, Delete, Folder } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { ref, onMounted } from 'vue'
/*
//listAudioService:表格显示API
//audioDeleteService:单个音频删除服务API
//updateAudioService:编辑修改音频信息API
*/
import { listAudioService, audioDeleteService, updateAudioService, getSrtContentService, updateSrtContentService } from '@/api/audio.js'

import { listGroupService, createGroupService, deleteGroupService } from '@/api/group.js'
//导入token
import { useTokenStore } from '@/stores/token.js';

import APlayer from 'aplayer';
import WaveSurfer from 'wavesurfer.js';



//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(10)//每页条数

//表格延迟属性
const tableLoading = ref(true)

//搜索框内容
const searchInput = ref('');

//token存在pinia
const tokenStore = useTokenStore();

//上传对象
const uploadRef = ref(null);

//上传对话框显示
const dialogTableVisible = ref(false)

//编辑表单是否显示
const dialogFormVisible = ref(false);

//编辑时选中的组名
const editGroupName = ref('');

//添加分组对话框显示
const createGroupDialogVisible = ref(false);

//删除分组对话框显示
const deleteGroupDialogVisible = ref(false);

//删除分组的Id
const deleteGroupId = ref('');

const srtDialogVisible = ref(false)

const srtContent = ref(''); // 字幕文件内容

//选择字母处理的当前行音频Id
const srtCurAudioId = ref('');

//上传的字幕文件名
const srtFileName = ref('');

//当前音频文件的字幕的URL
const curAudiosrtUrl = ref('');

//编辑表单模型
const dialogFormModel = ref({
    id: "",
    audioName: ""
})

// 文章列表数据模型
const audioTable = ref([
    {
        id: '',
        audioName: '',
        groupId: '',
        createTime: '',
        updateTime: '',
        audioUrl: '',// 添加音频URL字段
        srtUrl: ''
    }
]);

//分组列表数据模型
const groupTable = ref([
    {
        groupId: '',
        groupName: ''
    }
]);

//当前分组Id
const curGroup = ref({
    curGroupId: '-1',
    curGroupName: ''
}
);

const createGroupFromModel = ref({
    newGroupName: ''
})

//获取文章列表数据
const getAudioList = async () => {
    tableLoading.value = true;
    let params = {
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        searchName: searchInput.value ? searchInput.value : null,
        groupId: curGroup.value.curGroupId ? curGroup.value.curGroupId : null
    }
    let result = await listAudioService(params);

    //渲染视图
    total.value = result.data.total;
    audioTable.value = result.data.items;

    setTimeout(() => {
        tableLoading.value = false;
    }, 1000);

}

//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
    pageSize.value = size
    getAudioList()
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
    pageNum.value = num
    getAudioList()
}

// 提交上传的方法
const submitUpload = () => {
    // 检查 uploadRef.value 是否存在，然后调用 submit 方法
    if (uploadRef.value) {
        uploadRef.value.submit();
    }
};

//单个音频删除函数
const deleteAudio = (row) => {
    //提示用户确认框
    ElMessageBox.confirm(
        '你确认要从库中删除改音频吗？',
        '温馨提示',
        {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
        .then(async () => {
            //调用接口
            await audioDeleteService(row.id);
            ElMessage({
                type: 'success',
                message: '删除成功',
            })
            //刷新列表
            getAudioList();
        })
        .catch(() => {
            ElMessage({
                type: 'info',
                message: '用户取消了删除',
            })
        })
}

//显示编辑表单函数
const showFormDialog = (row) => {

    dialogFormModel.value.audioName = row.audioName;
    dialogFormModel.value.id = row.id;
    editGroupName.value = curGroup.value.curGroupName;
    dialogFormVisible.value = true;
}

//显示字幕对话框函数
const showSrtDialog = async (row) => {

    srtCurAudioId.value = row.id;
    curAudiosrtUrl.value = row.srtUrl;
    console.log(curAudiosrtUrl.value)

    if (curAudiosrtUrl.value != null) {
        try {

            // 去除 URL 中的查询参数
            const urlWithoutQuery = curAudiosrtUrl.value.split('?')[0];
            // 获取最后一个 / 后的部分
            srtFileName.value = urlWithoutQuery.substring(urlWithoutQuery.lastIndexOf('/') + 1);

            const response = await fetch('/oss' + srtFileName.value);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            srtContent.value = await response.text();
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    }

    srtDialogVisible.value = true;

}

//编辑修改音频信息函数
const updateAudio = async () => {


    // 封装请求体
    const requestBody = {
        id: dialogFormModel.value.id,
        audioName: dialogFormModel.value.audioName,
        groupName: editGroupName.value
    };

    //通过组名修改数据库，必须确保单用户组名唯一
    await updateAudioService(requestBody);
    getAudioList();
    dialogFormVisible.value = false;
    dialogFormModel.value.audioName = "";
    dialogFormModel.value.id = "";
}

//条件搜索函数
const searchButton = () => {

    getAudioList();
}

// 初始化 APlayer
let ap = null;
let wavesurfer = null;
onMounted(() => {
    ap = new APlayer({
        container: document.getElementById('aplayer'),
        audio: [] // 初始为空
    });

    // 初始化 Wavesurfer.js 
    wavesurfer = WaveSurfer.create({
        container: "#waveform",
        waveColor: "violet",
        progressColor: "purple",
        barHeight: 0.5
    });

    // 同步 APlayer 和 Wavesurfer.js
    ap.on('play', () => wavesurfer.play());
    ap.on('pause', () => wavesurfer.pause());
    // ap.on('timeupdate', () => {
    //     const currentTime = ap.audio.currentTime;
    //     wavesurfer.seekTo(currentTime / ap.audio.duration); 
    // });

    // wavesurfer.on('audioprocess', () => {
    //     const currentTime = wavesurfer.getCurrentTime();
    //     ap.audio.currentTime = currentTime;
    // });

});

// 播放音频
const playAudio = (row) => {
    ap.list.clear(); // 清空当前播放列表
    ap.list.add({
        name: row.audioName,
        artist: 'Unknown',
        url: row.audioUrl, // 设置点击的音频URL
        cover: '', // 如果有封面可以添加
    });
    // 加载音频文件
    wavesurfer.load('/oss' + row.audioUrl.substring(row.audioUrl.lastIndexOf('/') + 1));
    ap.play(); // 播放音频
};

// 行点击事件处理函数
const handleGroupRowClick = (row) => {

    curGroup.value.curGroupId = row.groupId;
    curGroup.value.curGroupName = row.groupName;
    getAudioList();
};

const getGroupList = async () => {

    let result = await listGroupService();

    //渲染视图
    groupTable.value = [
        {
            groupId: '-1',       // 默认项的 ID
            groupName: '全部'   // 默认项的组名
        },
        ...result.data         // 展开后台返回的数据并添加到数组中
    ];

}

const createGroup = async () => {

    // 封装请求体
    const requestBody = {
        groupName: createGroupFromModel.value.newGroupName
    };

    await createGroupService(requestBody);
    createGroupFromModel.value.newGroupName = '';
    createGroupDialogVisible.value = false;
    getGroupList();
}

const deleteGroup = async () => {

    await deleteGroupService(deleteGroupId.value);
    deleteGroupId.value = '';
    deleteGroupDialogVisible.value = false;
    curGroup.value.curGroupId = -1;
    curGroup.value.curGroupName = '全部';
    getAudioList();
    getGroupList();
}

const findGroupNameById = (id) => {
    const group = groupTable.value.find(g => g.groupId == id);
    return group ? group.groupName : null;
};

const getSrtContent = async (response) => {

    curAudiosrtUrl.value = response.data;

    // 去除 URL 中的查询参数
    const urlWithoutQuery = curAudiosrtUrl.value.split('?')[0];
    // 获取最后一个 / 后的部分
    srtFileName.value = urlWithoutQuery.substring(urlWithoutQuery.lastIndexOf('/') + 1);

    if (curAudiosrtUrl.value != '') {
        try {

            const response = await fetch('/oss' + srtFileName.value);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            srtContent.value = await response.text();
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    }

}

const updateSrtContent = async () => {

    // 封装请求体
    const requestBody = {
        srtUrl: curAudiosrtUrl.value,
        srtContent: srtContent.value
    };

    await updateSrtContentService(requestBody);
}

//初始加载表格
getGroupList();
getAudioList();
</script>



<template>
    <el-row :gutter="20" style="flex: 9">
        <el-col :span="6">
            <el-card class="page-container" shadow="hover">
                <template #header>
                    <div class="header">
                        <span>素材分组</span>
                    </div>
                </template>
                <el-button type="primary" @click="createGroupDialogVisible = true">添加分组</el-button>
                <el-button type="primary" @click="deleteGroupDialogVisible = true">删除分组</el-button>
                <el-table :data="groupTable" style="width: 100%" @row-click="handleGroupRowClick">
                    <el-table-column width="25px"><el-icon>
                            <Folder />
                        </el-icon></el-table-column>
                    <el-table-column prop="groupName"></el-table-column>
                    <template #empty>
                        <el-empty description="没有数据" />
                    </template>
                </el-table>
            </el-card>
        </el-col>

        <el-col :span="18">
            <el-card class="page-container">
                <template #header>
                    <div class="header">
                        <span>素材管理</span>
                    </div>
                </template>
                <!-- 搜索表单 -->
                <el-form inline class="search-form">
                    <el-form-item label="按名称搜索">
                        <el-input v-model="searchInput" placeholder="输入想要包含的名称"></el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="searchButton">搜索</el-button>
                        <el-button @click="searchInput = '';">重置</el-button>

                    </el-form-item>

                    <el-form-item class="add-audio-button">
                        <el-button type="primary" @click="dialogTableVisible = true">添加音频</el-button>
                    </el-form-item>

                </el-form>

                <!-- <el-scrollbar height="600px"> -->
                <!-- 文章列表 -->
                <el-table :data="audioTable" style="width: 100%" v-loading="tableLoading">
                    <el-table-column label="序号" width="100px">
                        <template #default="scope">
                            {{ scope.$index + (pageNum - 1) * pageSize + 1 }}
                        </template>
                    </el-table-column>
                    <el-table-column label="素材名称" prop="audioName"></el-table-column>
                    <el-table-column label="分组" prop="groupId" width="200px">

                        <template v-slot="scope">
                            {{ findGroupNameById(scope.row.groupId) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="更新时间" prop="updateTime" width="200px"> </el-table-column>
                    <el-table-column label="操作" width="250px">
                        <template #default="{ row }">
                            <el-button @click="playAudio(row)">播放</el-button>
                            <el-button @click="showSrtDialog(row)">字幕</el-button>
                            <el-button :icon="Edit" circle plain type="primary"
                                @click="showFormDialog(row)"></el-button>
                            <el-button :icon="Delete" circle plain type="danger" @click="deleteAudio(row)"></el-button>
                        </template>
                    </el-table-column>
                    <template #empty>
                        <el-empty description="没有数据" />
                    </template>
                </el-table>
                <!-- </el-scrollbar> -->
                <!-- 分页条 -->
                <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :page-sizes="[5, 10, 20]"
                    layout="jumper, total, sizes, prev, pager, next" background :total="total"
                    @size-change="onSizeChange" @current-change="onCurrentChange"
                    style="margin-top: 20px; justify-content: flex-end" />

                <!-- 添加音频对话框-->
                <transition name="dialog-fade">
                    <el-dialog v-model="dialogTableVisible" title="添加音频" width="800">
                        <el-upload ref="uploadRef" class="upload-demo" :auto-upload="false" :show-file-list="true"
                            action="/api/audio/upload" name="file"
                            :headers="{ 'Authorization': tokenStore.token, 'groupId': curGroup.curGroupId }"
                            accept=".wav, .mp3, .mp4, .doc, .docx, .pdf" multiple="true" limit="10"
                            :on-success="() => getAudioList()">

                            <template #trigger>
                                <el-button type="primary">选择文件</el-button>
                            </template>

                            <el-button type="success" @click="submitUpload">添加到音频库</el-button>

                            <template #tip>
                                <div class="el-upload__tip">
                                    自定义tip
                                </div>
                            </template>

                        </el-upload>
                    </el-dialog>
                </transition>

                <!-- 编辑音频信息对话框-->
                <transition name="dialog-fade">
                    <el-dialog v-model="dialogFormVisible" title="编辑音频" width="800">
                        <el-form label-width="auto" :mode="dialogFormModel">
                            <el-form-item label="素材名称" prop="audioName">
                                <el-input v-model="dialogFormModel.audioName" />
                            </el-form-item>

                            <el-form-item label="调整分组">
                                <el-select placeholder="请选择" v-model="editGroupName">
                                    <el-option v-for="group in groupTable" :key="group.id" :label="group.groupName"
                                        :value="group.groupName">
                                    </el-option>
                                </el-select>
                            </el-form-item>
                        </el-form>
                        <template #footer>
                            <span class="dialog-footer">
                                <el-button @click="dialogFormVisible = false">取消</el-button>
                                <el-button type="primary" @click="updateAudio()"> 确认 </el-button>
                            </span>
                        </template>
                    </el-dialog>
                </transition>

                <!-- 添加分组对话框-->
                <transition name="dialog-fade">
                    <el-dialog v-model="createGroupDialogVisible" title="添加分组" width="800">
                        <el-form :model="createGroupFromModel" label-width="auto">
                            <el-form-item label="组名">
                                <el-input v-model="createGroupFromModel.newGroupName" />
                            </el-form-item>
                        </el-form>
                        <template #footer>
                            <span class="dialog-footer">
                                <el-button type="primary" @click="createGroup">添加</el-button>
                                <el-button
                                    @click="createGroupFromModel.newGroupName = ''; createGroupDialogVisible = false">取消</el-button>
                            </span>
                        </template>
                    </el-dialog>
                </transition>

                <!-- 删除分组对话框-->
                <transition name="dialog-fade">
                    <el-dialog v-model="deleteGroupDialogVisible" title="删除分组" width="800">
                        <el-form label-width="auto">
                            <el-form-item label="选择要删除的分组">
                                <el-select placeholder="请选择" v-model="deleteGroupId">
                                    <el-option v-for="group in groupTable" :key="group.groupId" :label="group.groupName"
                                        :value="group.groupId">
                                    </el-option>
                                </el-select>
                            </el-form-item>
                        </el-form>
                        <template #footer>
                            <span class="dialog-footer">
                                <el-button type="primary" @click="deleteGroup">删除</el-button>
                                <el-button @click="deleteGroupId = ''; deleteGroupDialogVisible = false">取消</el-button>
                            </span>
                        </template>
                    </el-dialog>
                </transition>
            </el-card>

            <!-- 字幕对话框-->
            <transition name="dialog-fade">
                <el-dialog v-model="srtDialogVisible" title="字幕处理" width="800">
                    <el-row>
                        <el-col :span="14">
                            <div class="file-name-box">
                                {{ srtFileName }}
                            </div>
                        </el-col>
                        <el-col :span="5">
                            <el-upload class="upload-demo" :show-file-list="true" action="/api/audio/srtUpload"
                                name="file" :headers="{ 'Authorization': tokenStore.token, 'AudioId': srtCurAudioId }"
                                accept=".srt, .lrc, .txt" :on-success="(response) => getSrtContent(response)">

                                <el-button type="primary">选择文件</el-button>

                                <template #tip>
                                    <div class="el-upload__tip">
                                        自定义tip
                                    </div>
                                </template>

                            </el-upload>
                        </el-col>

                        <el-col :span="5">
                            <el-button type="primary" @click="updateSrtContent">
                                更新文件内容
                            </el-button>
                        </el-col>

                    </el-row>
                    <el-row>
                        <!-- 显示文件内容 -->
                        <div v-if="srtContent" class="srt-content">
                            <h3>文件内容：</h3>
                            <textarea v-model="srtContent" class="srt-editor"></textarea>
                        </div>

                        <div v-else class="srt-content">
                            <h3>请选择文件</h3>
                            <textarea v-model="srtContent" class="srt-editor"></textarea>
                        </div>

                    </el-row>
                </el-dialog>
            </transition>
        </el-col>
    </el-row>
    <el-row style="flex: 1">

        <!-- APlayer容器 -->

        <div class="audio-player">
            <div id="aplayer"></div>
            <div id="waveform"></div>
        </div>

    </el-row>

</template>



<style lang="scss" scoped>
// .group-card {
//     width: 100%;
//     height: 100%;
// }
.add-audio-button {
    margin-left: auto;
}

.search-form {
    display: flex;
    justify-content: space-between;
    /* 在容器中将按钮分布到两端 */
    align-items: center;
    /* 垂直居中对齐 */
}

.page-container {
    min-height: 100%;
    box-sizing: border-box;
    width: 100%;
    height: 100%;

    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: bold;
    }
}

:deep(.el-card__header) {
    background-color: #e8edf0;
    //   padding: 10px;         /* 设置内边距 */
    //   border-bottom: 1px solid #dcdcdc; /* 可选: 添加底部边框 */
}

.srt-content {
    overflow: hidden;
    /* 禁用外层容器的滚动条 */
    width: 100%;
    height: 100%;
    max-height: 500px;
}

.srt-editor {
    width: 100%;
    height: calc(100vh - 150px);
    /* 高度根据需要调整 */
    font-family: monospace;
    font-size: 14px;
    white-space: pre-wrap;
    border: 1px solid #ccc;
    padding: 10px;
    box-sizing: border-box;
    overflow-y: auto;
    /* 仅在 <textarea> 内部滚动 */
}

.file-name-box {
    width: 300px;
    height: 50px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 10px;
    margin-top: 10px;
    font-size: 14px;
    line-height: 30px;
    background-color: #f5f7fa;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
}

#waveform {
    position: absolute;
    // top: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50%;
    pointer-events: none;
    /* Prevent interaction with the waveform */
}

.audio-player {
    width: 100%;
    height: 200px;
    position: relative;
}
</style>