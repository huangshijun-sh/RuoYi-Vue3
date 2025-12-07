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

/**
 * 创建Excel导出任务
 * @param {Object} data 导出参数
 * @param {Number} data.datasourceId 数据源ID
 * @param {String} data.taskName 任务名称
 * @param {String} data.exportType 导出类型: 1-选中导出, 2-全部导出
 * @param {Number} data.totalRecords 导出记录数
 * @param {String} data.unitNames 单位名称列表(JSON)
 * @param {String} data.selectedIds 选中的ID列表(JSON) - 选中导出时
 * @param {String} data.filterSnapshot 筛选条件快照(JSON) - 全部导出时
 */
export function createExcelExportTask(data) {
  return request({
    url: '/dataanalysis/export/excel',
    method: 'post',
    data: data,
    timeout: 300000  // 5分钟超时
  })
}

/**
 * 下载Excel导出文件
 * @param {Number} taskId 任务ID
 */
export function downloadExcelFile(taskId) {
  return request({
    url: `/dataanalysis/export/excel/download/${taskId}`,
    method: 'get',
    responseType: 'blob',
    timeout: 600000  // 10分钟超时（大文件下载）
  })
}
