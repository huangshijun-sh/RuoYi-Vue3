<template>
  <div class="app-container tech-theme-container">
    <!-- Datasource Selection -->
    <el-card shadow="hover" class="mb-4">
      <div class="datasource-select">
        <div class="left-panel">
          <span class="label">当前数据源：</span>
          <el-select 
            v-model="currentDatasourceId" 
            placeholder="请选择数据源" 
            @change="handleDatasourceChange" 
            style="width: 300px"
            filterable
          >
            <el-option
              v-for="item in datasourceList"
              :key="item.datasourceId"
              :label="item.datasourceName"
              :value="item.datasourceId"
            >
              <span style="float: left">{{ item.datasourceName }}</span>
              <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                {{ item.dbHost }}
              </span>
            </el-option>
          </el-select>
        </div>
        <div class="actions">
           <!-- 新增：选中导出Excel -->
           <el-button
             type="warning"
             :disabled="!currentDatasourceId || selectedIds.size === 0"
             @click="handleExportSelectedExcel"
           >
             <el-icon><Document /></el-icon>
             选中导出Excel ({{ selectedIds.size }})
           </el-button>

           <el-button
             type="primary"
             :disabled="!currentDatasourceId || selectedIds.size === 0"
             icon="Download"
             @click="handleExportSelected"
           >
             导出选中 ({{ selectedIds.size }})
           </el-button>

           <!-- 新增：全部查询结果导出Excel -->
           <el-button
             type="warning"
             :disabled="!currentDatasourceId || total === 0 || !hasAnyFilter"
             plain
             @click="handleExportAllExcel"
           >
             <el-icon><Document /></el-icon>
             全部查询结果导出Excel
           </el-button>

           <el-button
             type="success"
             :disabled="!currentDatasourceId || total === 0 || !hasAnyFilter"
             icon="Download"
             plain
             @click="handleExportAll"
           >
             导出全部查询结果
           </el-button>
        </div>
      </div>
    </el-card>

    <!-- Filters & Table (Only show if datasource is selected) -->
    <div v-if="currentDatasourceId">
      <filter-bar
        :filter-options="filterOptions"
        @search="handleSearch"
        @reset="handleReset"
      />
      
      <data-table
        :data-list="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :selected-ids="selectedIds"
        @pagination="getList"
        @selection-change="handleSelectionChange"
      />
    </div>
    <el-empty v-else description="请先选择一个数据源进行浏览" />

    <!-- Export Confirm Dialog -->
    <export-confirm
      ref="confirmRef"
      :datasource-name="currentDatasourceName"
      :record-count="exportRecordCount"
      :export-type="exportType"
      :unit-names="exportUnitNames"
      @confirm="onConfirmExport"
    />

    <!-- Excel导出确认对话框 -->
    <excel-export-confirm
      ref="excelConfirmRef"
      :datasource-name="currentDatasourceName"
      :export-type="excelExportType"
      :record-count="excelExportRecordCount"
      :unit-names="excelExportUnitNames"
      @confirm="onConfirmExcelExport"
    />

    <!-- 进度显示 -->
    <el-dialog
      v-model="showExcelProgress"
      title="Excel导出进度"
      width="400px"
      :close-on-click-modal="false"
      :show-close="false"
      append-to-body
    >
      <div class="progress-content">
        <el-progress
          :percentage="excelExportProgress"
          :stroke-width="20"
          :text-inside="true"
        />
        <div class="progress-step">{{ excelExportStep }}</div>
      </div>

      <template #footer>
        <el-button 
          v-if="excelExportProgress < 100" 
          type="success" 
          plain 
          @click="runExcelExportInBackground"
        >
          后台运行
        </el-button>
        <el-button v-if="excelExportProgress < 100" @click="cancelExcelExport">
          取消导出
        </el-button>
        <el-button
          v-if="excelExportProgress === 100"
          type="primary"
          @click="handleDownloadExcel"
        >
          下载文件
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Browse">
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { listDatasources, getFilterOptions, listData } from '@/api/dataanalysis/browse';
import { createExportTask, createExcelExportTask, getExportTask, downloadExcelFile, cancelExportTask } from '@/api/dataanalysis/export';
import FilterBar from './components/FilterBar.vue';
import DataTable from './components/DataTable.vue';
import ExportConfirm from '../export/components/ExportConfirm.vue';
import ExcelExportConfirm from '../export/components/ExcelExportConfirm.vue';
import { ElMessage } from 'element-plus';
import { Document } from '@element-plus/icons-vue';

const router = useRouter();
const datasourceList = ref([]);
const currentDatasourceId = ref(null);
const filterOptions = reactive({
  years: [],
  industries: []
});
const dataList = ref([]);
const loading = ref(false);
const total = ref(0);
const selectedIds = ref(new Set());

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  years: [],
  unitCode: '',
  electronicDataName: '',
  quickSearch: ''
});

// Export related state
const confirmRef = ref(null);
const exportType = ref('selected');
const exportRecordCount = ref(0);
const exportUnitNames = ref([]);

// Excel Export related state
const excelConfirmRef = ref(null);
const excelExportType = ref('selected');
const excelExportRecordCount = ref(0);
const excelExportUnitNames = ref([]);

// 进度轮询相关
const excelTaskId = ref(null);
const excelExportProgress = ref(0);
const excelExportStep = ref('');
const showExcelProgress = ref(false);
let progressTimer = null;

const currentDatasourceName = computed(() => {
  const ds = datasourceList.value.find(d => d.datasourceId === currentDatasourceId.value);
  return ds ? ds.datasourceName : '';
});

// 检查是否有任何筛选条件
const hasAnyFilter = computed(() => {
  return (
    (queryParams.years && queryParams.years.length > 0) ||
    (queryParams.unitCode && queryParams.unitCode.trim() !== '') ||
    (queryParams.electronicDataName && queryParams.electronicDataName.trim() !== '') ||
    (queryParams.quickSearch && queryParams.quickSearch.trim() !== '')
  );
});

// Load datasources on mount
onMounted(() => {
  getDatasourceList();
});

function getDatasourceList() {
  listDatasources().then(res => {
    datasourceList.value = res.data || [];
  });
}

function handleDatasourceChange(val) {
  // Clear state
  selectedIds.value.clear();
  dataList.value = [];
  total.value = 0;
  queryParams.pageNum = 1;

  // Reset query params
  queryParams.years = [];
  queryParams.unitCode = '';
  queryParams.electronicDataName = '';
  queryParams.quickSearch = '';

  // Load filters and data
  if (val) {
    loadFilterOptions(val);
    getList();
  }
}

function loadFilterOptions(datasourceId) {
  getFilterOptions(datasourceId).then(res => {
    filterOptions.years = res.data.years || [];
    filterOptions.industries = res.data.industries || [];
  });
}

function getList() {
  if (!currentDatasourceId.value) return;
  
  loading.value = true;
  const params = {
    datasourceId: currentDatasourceId.value,
    ...queryParams
  };
  
  listData(params).then(res => {
    dataList.value = res.rows || [];
    total.value = res.total || 0;
    loading.value = false;
  }).catch(() => {
    loading.value = false;
    dataList.value = [];
    total.value = 0;
  });
}

function handleSearch(params) {
  queryParams.pageNum = 1;
  Object.assign(queryParams, params);
  getList();
}

function handleReset() {
  queryParams.pageNum = 1;
  queryParams.years = [];
  queryParams.unitCode = '';
  queryParams.electronicDataName = '';
  queryParams.quickSearch = '';
  getList();
}

function handleSelectionChange({ type, row, rows, isSelected }) {
  if (type === 'single') {
    if (isSelected) {
      selectedIds.value.add(row.electronicDataCode); // Assuming electronicDataCode is the ID
    } else {
      selectedIds.value.delete(row.electronicDataCode);
    }
  } else if (type === 'all') {
    rows.forEach(r => {
      if (isSelected) {
        selectedIds.value.add(r.electronicDataCode);
      } else {
        selectedIds.value.delete(r.electronicDataCode);
      }
    });
  }
}

function handleExportSelectedExcel() {
  excelExportType.value = 'selected';
  excelExportRecordCount.value = selectedIds.value.size;

  // 获取选中记录的单位名称
  const selectedRecords = dataList.value.filter(row =>
    selectedIds.value.has(row.electronicDataCode)
  );
  const unitNamesSet = new Set(
    selectedRecords.map(row => row.unitName).filter(name => name)
  );
  excelExportUnitNames.value = Array.from(unitNamesSet);

  excelConfirmRef.value.open();
}

function handleExportAllExcel() {
  // 检查数据量限制
  if (total.value > 10000) {
    ElMessage.warning('导出数据量超过10000条，建议缩小筛选范围');
    return;
  }

  excelExportType.value = 'all';
  excelExportRecordCount.value = total.value;

  // 获取当前数据的单位名称（作为样本）
  const unitNamesSet = new Set(
    dataList.value.map(row => row.unitName).filter(name => name)
  );
  excelExportUnitNames.value = Array.from(unitNamesSet);

  excelConfirmRef.value.open();
}

/**
 * 确认Excel导出
 */
function onConfirmExcelExport(done) {
  // 生成任务名称
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const typeLabel = excelExportType.value === 'selected' ? '选中导出Excel' : '全部导出Excel';
  const taskName = `${currentDatasourceName.value}_${typeLabel}_${timestamp}`;

  // 构造请求数据
  const data = {
    datasourceId: currentDatasourceId.value,
    datasourceName: currentDatasourceName.value,
    taskName: taskName,
    exportType: excelExportType.value === 'selected' ? '1' : '2',
    exportFormat: 'excel',
    totalRecords: excelExportRecordCount.value,
    unitNames: JSON.stringify(excelExportUnitNames.value)
  };

  // 根据导出类型设置不同参数
  if (excelExportType.value === 'selected') {
    data.selectedIds = JSON.stringify(Array.from(selectedIds.value));
  } else {
    data.filterSnapshot = JSON.stringify({ ...queryParams });
  }

  // 调用API创建任务
  createExcelExportTask(data)
    .then(res => {
      ElMessage.success('Excel导出任务已创建');

      // 清空选择（选中导出时）
      if (excelExportType.value === 'selected') {
        selectedIds.value.clear();
      }

      // 回调传递taskId
      const taskId = res.data || res.taskId;
      done(taskId);

      // 启动进度轮询
      if (taskId) {
        startProgressPolling(taskId);
      }
    })
    .catch(err => {
      ElMessage.error('创建导出任务失败: ' + (err.msg || err.message));
      done(null);
    });
}

/**
 * 开始轮询导出进度
 */
function startProgressPolling(taskId) {
  excelTaskId.value = taskId;
  showExcelProgress.value = true;
  excelExportProgress.value = 0;

  // 每秒轮询一次
  progressTimer = setInterval(() => {
    pollExportProgress(taskId);
  }, 1000);
}

/**
 * 轮询导出进度
 */
async function pollExportProgress(taskId) {
  try {
    const res = await getExportTask(taskId);
    const task = res.data;

    excelExportProgress.value = task.progressPercent || 0;
    excelExportStep.value = task.progressSteps || '处理中...';

    // 检查任务状态
    if (task.taskStatus === '2') {
      // 完成
      clearInterval(progressTimer);
      excelExportProgress.value = 100;
      excelExportStep.value = '导出完成';
      ElMessage.success('Excel导出完成，可以下载文件');
    } else if (task.taskStatus === '3') {
      // 失败
      clearInterval(progressTimer);
      showExcelProgress.value = false;
      ElMessage.error('导出失败: ' + task.errorMsg);
    } else if (task.taskStatus === '4') {
      // 已取消
      clearInterval(progressTimer);
      showExcelProgress.value = false;
      ElMessage.info('导出任务已取消');
    }
  } catch (err) {
    console.error('获取进度失败', err);
  }
}

/**
 * 后台运行Excel导出
 */
function runExcelExportInBackground() {
  // 停止轮询
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
  
  // 关闭对话框
  showExcelProgress.value = false;
  
  // 提示用户
  ElMessage.success('任务已转入后台运行，请至"数据导出"页面查看进度');
  
  // 清除当前任务ID
  excelTaskId.value = null;
}

/**
 * 取消导出
 */
function cancelExcelExport() {
  if (excelTaskId.value) {
    cancelExportTask(excelTaskId.value).then(() => {
      clearInterval(progressTimer);
      showExcelProgress.value = false;
      ElMessage.info('已取消导出');
    });
  }
}

/**
 * 处理Excel文件下载
 */
async function handleDownloadExcel() {
  if (!excelTaskId.value) {
    ElMessage.error('任务ID不存在');
    return;
  }

  try {
    ElMessage.info('正在准备下载...');

    const response = await downloadExcelFile(excelTaskId.value);

    // 创建Blob对象
    const blob = new Blob([response], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // 从响应头获取文件名，或生成默认文件名
    const contentDisposition = response.headers?.['content-disposition'];
    let fileName = `数据导出_${currentDatasourceName.value}_${Date.now()}.xlsx`;

    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^;\r\n"']*)['"]?/);
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = decodeURIComponent(fileNameMatch[1]);
      }
    }

    // 创建下载链接
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.style.display = 'none';

    // 触发下载
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    // 关闭进度对话框
    showExcelProgress.value = false;
    excelTaskId.value = null;

    ElMessage.success('文件下载成功');

  } catch (err) {
    console.error('下载失败', err);
    ElMessage.error('文件下载失败: ' + (err.msg || err.message || '未知错误'));
  }
}

// 组件销毁时清理定时器
onUnmounted(() => {
  if (progressTimer) {
    clearInterval(progressTimer);
  }
});

function handleExportSelected() {
  exportType.value = 'selected';
  exportRecordCount.value = selectedIds.value.size;

  // Get distinct unit names from selected records
  const selectedRecords = dataList.value.filter(row => selectedIds.value.has(row.electronicDataCode));
  const unitNamesSet = new Set(selectedRecords.map(row => row.unitName).filter(name => name));
  exportUnitNames.value = Array.from(unitNamesSet);

  confirmRef.value.open();
}

function handleExportAll() {
  if (total.value > 10000) {
    ElMessage.warning('导出数据量超过10000条，建议缩小筛选范围');
    return;
  }
  exportType.value = 'all';
  exportRecordCount.value = total.value;

  // Get distinct unit names from current data list (as sample)
  const unitNamesSet = new Set(dataList.value.map(row => row.unitName).filter(name => name));
  exportUnitNames.value = Array.from(unitNamesSet);

  confirmRef.value.open();
}

function onConfirmExport(done) {
  // 生成任务名称: 数据源名称_导出类型_时间戳
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const typeLabel = exportType.value === 'selected' ? '选中导出' : '全部导出';
  const taskName = `${currentDatasourceName.value}_${typeLabel}_${timestamp}`;

  const data = {
    datasourceId: currentDatasourceId.value,
    taskName: taskName,
    exportType: exportType.value === 'selected' ? '1' : '2',  // 1=选中导出, 2=全部导出
    totalRecords: exportRecordCount.value,
    unitNames: JSON.stringify(exportUnitNames.value)  // 单位名称列表
  };

  if (exportType.value === 'selected') {
    data.selectedIds = JSON.stringify(Array.from(selectedIds.value));
  } else {
    // Pass current filter criteria
    data.filterSnapshot = JSON.stringify({ ...queryParams });
  }

    createExportTask(data).then(res => {
    // Clear selection after successful export (both selected and all export)
    selectedIds.value.clear();

    // 传递任务ID给确认对话框，让它显示进度区域
    // 不再自动跳转到进度页面，由用户在确认对话框中选择
    done(res.taskId);
  }).catch(() => {
    // 任务创建失败，传递null关闭对话框
    done(null);
  });
}
</script>

<style lang="scss" scoped>
.mb-4 {
  margin-bottom: 16px;
}
.datasource-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .left-panel {
    display: flex;
    align-items: center;
  }
  
  .label {
    font-weight: bold;
    margin-right: 12px;
  }
  
  .actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}
.progress-content {
  padding: 20px 0;
  text-align: center;
}

.progress-step {
  margin-top: 15px;
  color: #606266;
  font-size: 14px;
}
</style>
