import request from '@/utils/request.js'
import { useTokenStore } from '@/stores/token.js'

//单行音频删除
export const audioDeleteService = (id)=>{
    return request.delete('/audio?id='+id)
}

//音频列表查询
export const listAudioService = (params)=>{
    return  request.get('/audio',{params:params})
 }

 //音频信息修改
export const updateAudioService = (requestBody)=>{
    return  request.put('/audio/update',requestBody)
 }

  //获取字幕文件内容
export const getSrtContentService = (params)=>{
    return  request.get('/audio/srtContent',{params:params})
 }

export const updateSrtContentService = (requestBody)=>{
    request.put('/audio/srtContent', requestBody)
}



