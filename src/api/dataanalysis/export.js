import request from '@/utils/request'

// 创建导出任务
export function createExportTask(data) {
  return request({
    url: '/dataanalysis/export',
    method: 'post',
    data: data,
    timeout: 300000  // 设置5分钟超时,因为创建导出任务可能需要较长时间(验证数据、创建数据库记录等)
  })
}

// 查询导出任务列表
export function listExportTasks(query) {
  return request({
    url: '/dataanalysis/export/list',
    method: 'get',
    params: query
  })
}

// 获取导出任务详情
export function getExportTask(taskId) {
  return request({
    url: '/dataanalysis/export/' + taskId,
    method: 'get'
  })
}

// 取消导出任务
export function cancelExportTask(taskId) {
  return request({
    url: '/dataanalysis/export/cancel',
    method: 'post',
    data: { taskId }
  })
}

// 下载导出文件
export function downloadExportFile(taskId) {
  return request({
    url: '/dataanalysis/export/download/' + taskId,
    method: 'get',
    responseType: 'blob'
  })
}

// 删除导出任务
export function deleteExportTask(taskId) {
  return request({
    url: '/dataanalysis/export/' + taskId,
    method: 'delete'
  })
}
