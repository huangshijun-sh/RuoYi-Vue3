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
           <el-button
             type="primary"
             :disabled="!currentDatasourceId || selectedIds.size === 0"
             icon="Download"
             @click="handleExportSelected"
           >
             导出选中 ({{ selectedIds.size }})
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
  </div>
</template>

<script setup name="Browse">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { listDatasources, getFilterOptions, listData } from '@/api/dataanalysis/browse';
import { createExportTask } from '@/api/dataanalysis/export';
import FilterBar from './components/FilterBar.vue';
import DataTable from './components/DataTable.vue';
import ExportConfirm from '../export/components/ExportConfirm.vue';
import { ElMessage } from 'element-plus';

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
  }
}
</style>
