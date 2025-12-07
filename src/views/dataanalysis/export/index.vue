<template>
  <div class="app-container tech-theme-container">
    <el-card class="mb-4">
      <el-form :model="queryParams" ref="queryRef" :inline="true">
        <el-form-item label="任务状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 200px">
            <el-option label="等待中" value="pending" />
            <el-option label="进行中" value="processing" />
            <el-option label="已完成" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="导出格式" prop="exportFormat">
          <el-select v-model="queryParams.exportFormat" placeholder="全部格式" clearable style="width: 200px">
            <el-option label="数据库备份" value="bak" />
            <el-option label="Excel文件" value="excel" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>

        <el-form-item style="float: right">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="table"><el-icon><Notebook /></el-icon> 表格</el-radio-button>
            <el-radio-button label="card"><el-icon><Menu /></el-icon> 卡片</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格视图 -->
    <div v-if="viewMode === 'table'" v-loading="loading">
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            type="danger"
            plain
            icon="Delete"
            :disabled="multiple"
            @click="handleBatchDelete"
          >批量删除</el-button>
        </el-col>
      </el-row>

      <el-table :data="taskList" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="任务ID" prop="taskId" width="80" align="center" />
        <el-table-column label="任务名称" prop="taskName" :show-overflow-tooltip="true" width="280" />
        <el-table-column label="数据源" prop="datasourceName" :show-overflow-tooltip="true" />
        <el-table-column label="导出格式" prop="exportFormat" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.exportFormat === 'excel'" type="success" size="small" effect="plain">Excel</el-tag>
            <el-tag v-else-if="scope.row.exportFormat === 'bak' || !scope.row.exportFormat" type="warning" size="small" effect="plain">备份文件</el-tag>
            <span v-else>{{ scope.row.exportFormat }}</span>
          </template>
        </el-table-column>
        <el-table-column label="导出类型" prop="exportType" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.exportType === '1'" type="primary" size="small">选中导出</el-tag>
            <el-tag v-else-if="scope.row.exportType === '2'" type="success" size="small">全部导出</el-tag>
            <span v-else>{{ scope.row.exportType }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="taskStatus" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.taskStatus === '0'" type="info">等待中</el-tag>
            <el-tag v-else-if="scope.row.taskStatus === '1'" type="warning">进行中</el-tag>
            <el-tag v-else-if="scope.row.taskStatus === '2'" type="success">已完成</el-tag>
            <el-tag v-else-if="scope.row.taskStatus === '3'" type="danger">失败</el-tag>
            <el-tag v-else-if="scope.row.taskStatus === '4'" type="info">已取消</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" prop="progressPercent" width="120" align="center">
          <template #default="scope">
            <el-progress :percentage="scope.row.progressPercent || 0" :status="scope.row.taskStatus === '3' ? 'exception' : (scope.row.taskStatus === '2' ? 'success' : '')" />
          </template>
        </el-table-column>
        <el-table-column label="记录数" prop="totalRecords" width="80" align="center" />
        <el-table-column label="单位名称" prop="unitNames" min-width="150" align="center" :show-overflow-tooltip="true">
          <template #default="scope">
            <span>{{ formatUnitNames(scope.row.unitNames) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="160" align="center" />
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.taskStatus === '1' || scope.row.taskStatus === '0'"
              link
              type="primary"
              icon="View"
              @click="handleView(scope.row)"
            >查看</el-button>
            <el-button
              v-if="scope.row.taskStatus === '2'"
              link
              type="primary"
              icon="Download"
              @click="handleDownload(scope.row)"
            >下载</el-button>
            <el-button
              v-if="scope.row.taskStatus === '1' || scope.row.taskStatus === '0'"
              link
              type="warning"
              icon="Close"
              @click="handleCancel(scope.row)"
            >取消</el-button>
            <el-button
              link
              type="primary"
              icon="Document"
              @click="handleViewLog(scope.row)"
            >日志</el-button>
            <el-button
              link
              type="danger"
              icon="Delete"
              @click="handleDelete(scope.row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="total === 0 && !loading" description="暂无导出任务" />
    </div>

    <!-- 卡片视图 -->
    <div v-else class="task-list" v-loading="loading">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="task in taskList" :key="task.taskId">
          <task-card
            :task="task"
            @download="handleDownload"
            @cancel="handleCancel"
            @delete="handleDelete"
            @view="handleView"
            @viewLog="handleViewLog"
          />
        </el-col>
      </el-row>

      <el-empty v-if="total === 0 && !loading" description="暂无导出任务" />
    </div>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      :page-sizes="[12, 24, 36, 60]"
      @pagination="getList"
    />

    <!-- 日志查看对话框 -->
    <el-dialog
      v-model="logDialogVisible"
      title="执行日志"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="log-container">
        <pre class="log-content">{{ currentLog || '暂无日志' }}</pre>
      </div>
      <template #footer>
        <el-button @click="logDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="copyLog">复制日志</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ExportList">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { listExportTasks, cancelExportTask, deleteExportTask, downloadExportFile, downloadExcelFile, getExportTask } from '@/api/dataanalysis/export';
import TaskCard from './components/TaskCard.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Notebook, Menu } from '@element-plus/icons-vue';

const router = useRouter();
const viewMode = ref('card'); // 默认卡片视图
const loading = ref(false);
const taskList = ref([]);
const total = ref(0);
const logDialogVisible = ref(false);
const currentLog = ref('');
const ids = ref([]);
const multiple = ref(true);
let pollingTimer = null; // 轮询定时器

const queryParams = reactive({
  pageNum: 1,
  pageSize: 12,
  status: undefined,
  exportFormat: undefined
});

// 检查是否有进行中的任务
const hasProcessingTasks = computed(() => {
  return taskList.value.some(task => task.taskStatus === '0' || task.taskStatus === '1');
});

onMounted(() => {
  getList();
  // 启动轮询
  startPolling();
});

onUnmounted(() => {
  // 清理轮询定时器
  stopPolling();
});

// 启动轮询
function startPolling() {
  stopPolling(); // 先清理旧的定时器
  pollingTimer = setInterval(() => {
    // 只有在有进行中任务时才自动刷新
    if (hasProcessingTasks.value) {
      getListSilent();
    }
  }, 3000); // 每3秒刷新一次
}

// 停止轮询
function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

// 静默获取列表（不显示loading）
function getListSilent() {
  listExportTasks(queryParams).then(res => {
    taskList.value = res.rows;
    total.value = res.total;
  });
}

function getList() {
  loading.value = true;
  listExportTasks(queryParams).then(res => {
    taskList.value = res.rows;
    total.value = res.total;
    loading.value = false;
  }).catch(() => {
    loading.value = false;
  });
}

function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

function resetQuery() {
  queryParams.status = undefined;
  queryParams.exportFormat = undefined;
  handleQuery();
}

function handleView(task) {
  router.push({
    path: '/dataanalysis/export/progress',
    query: { taskId: task.taskId }
  });
}

function handleDownload(task) {
  if (task.exportFormat === 'excel') {
    downloadExcelFile(task.taskId).then(res => {
      const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      // 如果后端返回了文件名，应该优先使用 content-disposition，这里简单处理使用任务名
      const fileName = (task.taskName || `export_${task.taskId}`) + '.xlsx';
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(link.href);
      ElMessage.success('开始下载Excel文件...');
    }).catch(error => {
      ElMessage.error('下载失败: ' + (error.message || '未知错误'));
    });
  } else {
    // 默认为数据库备份文件
    downloadExportFile(task.taskId).then(res => {
      const blob = new Blob([res]);
      const fileName = `export_${task.taskId}_${new Date().getTime()}.bak`;
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(link.href);
      ElMessage.success('开始下载备份文件...');
    }).catch(error => {
      ElMessage.error('下载失败: ' + (error.message || '未知错误'));
    });
  }
}

function handleCancel(task) {
  ElMessageBox.confirm('确定要取消该导出任务吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    cancelExportTask(task.taskId).then(() => {
      ElMessage.success('任务已取消');
      getList();
    });
  });
}

function handleDelete(task) {
  ElMessageBox.confirm('确定要删除该导出任务记录吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteExportTask(task.taskId).then(() => {
      ElMessage.success('任务已删除');
      getList();
    });
  });
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.taskId);
  multiple.value = !selection.length;
}

// 批量删除
function handleBatchDelete() {
  ElMessageBox.confirm('确定要删除选中的 ' + ids.value.length + ' 个导出任务吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 循环调用删除接口
    const deletePromises = ids.value.map(taskId => deleteExportTask(taskId));

    Promise.all(deletePromises).then(() => {
      ElMessage.success('已成功删除 ' + ids.value.length + ' 个任务');
      getList();
    }).catch(error => {
      ElMessage.error('删除失败: ' + (error.message || '未知错误'));
      getList(); // 即使部分失败也刷新列表
    });
  });
}

// 查看日志
function handleViewLog(task) {
  // 重新获取任务详情以确保获取最新的日志
  getExportTask(task.taskId).then(res => {
    currentLog.value = res.data.executionLog;
    logDialogVisible.value = true;
  });
}

// 复制日志
function copyLog() {
  navigator.clipboard.writeText(currentLog.value).then(() => {
    ElMessage.success('日志已复制到剪贴板');
  }).catch(() => {
    ElMessage.error('复制失败');
  });
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '-';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

// 格式化单位名称显示
function formatUnitNames(value) {
  if (!value) return '-';
  let unitNames = value;
  if (typeof value === 'string') {
    try {
      unitNames = JSON.parse(value);
    } catch (e) {
      return '-';
    }
  }
  
  if (!Array.isArray(unitNames) || unitNames.length === 0) return '-';
  
  if (unitNames.length > 3) {
    return unitNames.slice(0, 3).join('，') + '等';
  }
  return unitNames.join('，');
}
</script>

<style lang="scss" scoped>
.task-list {
  min-height: 400px;
}
.mb-4 {
  margin-bottom: 16px;
}
.mb8 {
  margin-bottom: 8px;
}

.log-container {
  max-height: 500px;
  overflow-y: auto;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 15px;

  .log-content {
    margin: 0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.5;
    color: #333;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
}
</style>

