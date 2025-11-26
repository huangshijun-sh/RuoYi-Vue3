import request from '@/utils/request'

// 查询数据源列表
export function listDatasources() {
  return request({
    url: '/dataanalysis/browse/datasources',
    method: 'get'
  })
}

// 获取筛选条件选项
export function getFilterOptions(datasourceId) {
  return request({
    url: '/dataanalysis/browse/filters/' + datasourceId,
    method: 'get'
  })
}

// 查询电子数据列表
export function listData(query) {
  return request({
    url: '/dataanalysis/browse/list',
    method: 'get',
    params: query
  })
}

// 查询电子数据详情
export function getDataDetail(id) {
  return request({
    url: '/dataanalysis/browse/detail/' + id,
    method: 'get'
  })
}

// 统计查询结果总数
export function countData(query) {
  return request({
    url: '/dataanalysis/browse/count',
    method: 'get',
    params: query
  })
}
