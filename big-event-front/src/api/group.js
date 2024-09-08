import request from '@/utils/request.js'

export const listGroupService = ()=>{
    return  request.get('group')
 }

export const createGroupService = (requestBody) => {
    return  request.put('group/create', requestBody)
}

export const deleteGroupService = (deleteGroupId) => {
    return  request.delete('group/delete?deleteGroupId='+deleteGroupId)
}