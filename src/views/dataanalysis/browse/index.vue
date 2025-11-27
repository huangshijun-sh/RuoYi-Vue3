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
             :disabled="selectedIds.size === 0" 
             icon="Download" 
             @click="handleExportSelected"
           >
             导出选中 ({{ selectedIds.size }})
           </el-button>
           <el-button 
             type="success" 
             :disabled="total === 0" 
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
  </div>
</template>

<script setup name="DataBrowse">
import { ref, reactive, onMounted } from 'vue';
import { listDatasources, getFilterOptions, listData } from '@/api/dataanalysis/browse';
import FilterBar from './components/FilterBar.vue';
import DataTable from './components/DataTable.vue';
import { ElMessage } from 'element-plus';

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

// Load datasources on mount
onMounted(() => {
  getDatasourceList();
});

function getDatasourceList() {
  listDatasources().then(res => {
    // Depending on backend implementation, it might be res.data or res.rows
    // Assuming res.data for a non-paginated list dropdown
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
  
  // Handle array params for query string if needed, mostly handled by request.js/axios
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
  // Update queryParams with values from FilterBar
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
      selectedIds.value.add(row.electronicDataCode);
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
  // Placeholder for US3
  ElMessage.success(`准备导出 ${selectedIds.value.size} 条记录 (功能开发中)`);
}

function handleExportAll() {
  // Placeholder for US3
  ElMessage.success(`准备导出全部 ${total.value} 条记录 (功能开发中)`);
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

