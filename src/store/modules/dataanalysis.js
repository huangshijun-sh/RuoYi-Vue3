import { defineStore } from 'pinia'

/**
 * 数据分析模块 - Pinia状态管理
 * 用于管理数据源选择、筛选条件、导出任务等状态
 */
const useDataAnalysisStore = defineStore('dataanalysis', {
  state: () => ({
    // 当前选中的数据源
    currentDatasource: null,

    // 数据浏览 - 筛选条件
    browseFilters: {
      年度: null,
      所属单位: null,
      行业名称: null,
      电子数据编号: '',
      创建开始日期: null,
      创建结束日期: null
    },

    // 数据浏览 - 跨页选中的记录ID集合
    selectedRecordIds: new Set(),

    // 数据浏览 - 当前页选中的记录
    currentPageSelection: [],

    // 导出任务 - 当前导出任务ID
    currentExportTaskId: null,

    // 导出任务 - 轮询定时器ID
    exportProgressTimerId: null,

    // 筛选条件选项缓存 (按数据源ID缓存)
    filterOptionsCache: {}
  }),

  getters: {
    /**
     * 获取选中记录数量
     */
    selectedCount: (state) => {
      return state.selectedRecordIds.size
    },

    /**
     * 获取选中记录ID数组
     */
    selectedRecordIdsArray: (state) => {
      return Array.from(state.selectedRecordIds)
    },

    /**
     * 判断记录是否已选中
     */
    isRecordSelected: (state) => (recordId) => {
      return state.selectedRecordIds.has(recordId)
    },

    /**
     * 获取当前数据源的筛选选项
     */
    currentDatasourceFilterOptions: (state) => {
      if (!state.currentDatasource || !state.currentDatasource.datasourceId) {
        return null
      }
      return state.filterOptionsCache[state.currentDatasource.datasourceId]
    },

    /**
     * 判断是否有激活的筛选条件
     */
    hasActiveFilters: (state) => {
      const filters = state.browseFilters
      return !!(
        filters.年度 ||
        filters.所属单位 ||
        filters.行业名称 ||
        filters.电子数据编号 ||
        filters.创建开始日期 ||
        filters.创建结束日期
      )
    }
  },

  actions: {
    /**
     * 设置当前数据源
     */
    setCurrentDatasource(datasource) {
      this.currentDatasource = datasource
    },

    /**
     * 更新筛选条件
     */
    updateBrowseFilters(filters) {
      this.browseFilters = { ...this.browseFilters, ...filters }
    },

    /**
     * 重置筛选条件
     */
    resetBrowseFilters() {
      this.browseFilters = {
        年度: null,
        所属单位: null,
        行业名称: null,
        电子数据编号: '',
        创建开始日期: null,
        创建结束日期: null
      }
    },

    /**
     * 添加选中记录
     */
    addSelectedRecord(recordId) {
      this.selectedRecordIds.add(recordId)
    },

    /**
     * 移除选中记录
     */
    removeSelectedRecord(recordId) {
      this.selectedRecordIds.delete(recordId)
    },

    /**
     * 批量添加选中记录
     */
    addSelectedRecords(recordIds) {
      recordIds.forEach(id => {
        this.selectedRecordIds.add(id)
      })
    },

    /**
     * 批量移除选中记录
     */
    removeSelectedRecords(recordIds) {
      recordIds.forEach(id => {
        this.selectedRecordIds.delete(recordId)
      })
    },

    /**
     * 切换记录选中状态
     */
    toggleRecordSelection(recordId) {
      if (this.selectedRecordIds.has(recordId)) {
        this.selectedRecordIds.delete(recordId)
      } else {
        this.selectedRecordIds.add(recordId)
      }
    },

    /**
     * 清空选中记录
     */
    clearSelectedRecords() {
      this.selectedRecordIds.clear()
    },

    /**
     * 更新当前页选中状态
     */
    updateCurrentPageSelection(selection) {
      this.currentPageSelection = selection
    },

    /**
     * 缓存筛选条件选项
     */
    cacheFilterOptions(datasourceId, options) {
      this.filterOptionsCache[datasourceId] = options
    },

    /**
     * 设置当前导出任务ID
     */
    setCurrentExportTaskId(taskId) {
      this.currentExportTaskId = taskId
    },

    /**
     * 设置导出进度轮询定时器
     */
    setExportProgressTimer(timerId) {
      // 清除旧的定时器
      if (this.exportProgressTimerId) {
        clearInterval(this.exportProgressTimerId)
      }
      this.exportProgressTimerId = timerId
    },

    /**
     * 清除导出进度轮询定时器
     */
    clearExportProgressTimer() {
      if (this.exportProgressTimerId) {
        clearInterval(this.exportProgressTimerId)
        this.exportProgressTimerId = null
      }
    },

    /**
     * 重置数据分析模块状态
     */
    reset() {
      this.currentDatasource = null
      this.resetBrowseFilters()
      this.clearSelectedRecords()
      this.currentPageSelection = []
      this.currentExportTaskId = null
      this.clearExportProgressTimer()
      this.filterOptionsCache = {}
    }
  }
})

export default useDataAnalysisStore
