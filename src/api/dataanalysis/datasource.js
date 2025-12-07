import request from '@/utils/request'

// 查询数据源列表
export function listDatasource(query) {
  return request({
    url: '/dataanalysis/datasource/list',
    method: 'get',
    params: query
  })
}

// 查询数据源详情
export function getDatasource(datasourceId) {
  return request({
    url: '/dataanalysis/datasource/' + datasourceId,
    method: 'get'
  })
}

// 新增数据源
export function addDatasource(data) {
  return request({
    url: '/dataanalysis/datasource',
    method: 'post',
    data: data
  })
}

// 修改数据源
export function updateDatasource(data) {
  return request({
    url: '/dataanalysis/datasource',
    method: 'put',
    data: data
  })
}

// 删除数据源
export function delDatasource(datasourceId) {
  return request({
    url: '/dataanalysis/datasource/' + datasourceId,
    method: 'delete'
  })
}

// 测试数据源连接
export function testDatasource(datasourceId) {
  return request({
    url: '/dataanalysis/datasource/test/' + datasourceId,
    method: 'get'
  })
}

// 静默测试数据源连接（不显示错误提示）
export function testDatasourceSilent(datasourceId) {
  return request({
    url: '/dataanalysis/datasource/test/' + datasourceId,
    method: 'get',
    headers: {
      showError: false
    }
  })
}

// 修改数据源状态
export function changeDatasourceStatus(datasourceId, status) {
  const data = {
    datasourceId,
    status
  }
  return request({
    url: '/dataanalysis/datasource/changeStatus',
    method: 'put',
    data: data
  })
}

// 导出数据源配置
export function exportDatasource(query) {
  return request({
    url: '/dataanalysis/datasource/export',
    method: 'post',
    params: query
  })
}

// 查询数据源连接日志
export function listDatasourceLog(query) {
  return request({
    url: '/dataanalysis/datasource/log/list',
    method: 'get',
    params: query
  })
}

// 清空数据源日志
export function cleanDatasourceLog(datasourceId) {
  return request({
    url: '/dataanalysis/datasource/log/clean/' + datasourceId,
    method: 'delete'
  })
}
