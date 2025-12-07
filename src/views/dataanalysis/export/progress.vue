<template>
  <div class="app-container progress-page">
    <el-card class="box-card progress-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>导出任务进度</span>
          <el-button class="button" text @click="goBack">返回列表</el-button>
        </div>
      </template>
      
      <div v-if="task" class="task-content">
        <h2 class="status-title">{{ getStatusLabel(currentStatus) }}</h2>
        <p class="status-desc">{{ task.errorMessage || getStatusDesc(currentStatus) }}</p>
        
        <div class="progress-container">
          <el-progress 
            type="dashboard" 
            :percentage="task.progressPercent" 
            :status="getProgressStatus(currentStatus)"
            :width="200"
          >
            <template #default="{ percentage }">
              <span class="percentage-value">{{ percentage }}%</span>
              <span class="percentage-label">当前进度</span>
            </template>
          </el-progress>
          
          <div class="steps-container">
            <el-steps :active="activeStep" finish-status="success" direction="vertical">
              <el-step title="任务初始化" />
              <el-step title="数据提取" description="从源数据库读取数据" />
              <el-step title="构建临时库" description="生成单位树和关联表" />
              <el-step title="生成备份文件" description="执行SQL Server备份" />
              <el-step title="完成" description="准备下载链接" />
            </el-steps>
          </div>
        </div>
        
        <div class="current-action" v-if="currentStatus === 'processing'">
          <span class="label">正在执行:</span>
          <span class="value">{{ task.progressSteps || '处理中...' }}</span>
        </div>
        
        <div class="actions mt-4">
          <el-button 
            v-if="currentStatus === 'success'" 
            type="primary" 
            size="large" 
            icon="Download" 
            @click="handleDownload"
          >
            下载Excel文件
          </el-button>
          
          <el-button 
            v-if="currentStatus === 'processing'" 
            type="danger" 
            size="large" 
            icon="VideoPause" 
            @click="handleCancel"
          >
            取消任务
          </el-button>
          
          <el-button 
            v-if="['success', 'failed', 'cancelled'].includes(currentStatus)" 
            size="large" 
            @click="goBack"
          >
            返回列表
          </el-button>
        </div>
      </div>
      
      <el-empty v-else description="未找到任务信息" />
    </el-card>
  </div>
</template>

<script setup name="ExportProgress">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getExportTask, cancelExportTask, downloadExportFile } from '@/api/dataanalysis/export';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const router = useRouter();
const taskId = route.query.taskId;

const task = ref(null);
const loading = ref(true);
const timer = ref(null);

// 状态映射
const statusMap = {
  '0': 'pending',
  '1': 'processing',
  '2': 'success',
  '3': 'failed',
  '4': 'cancelled'
};

const currentStatus = computed(() => {
  if (!task.value) return 'pending';
  return statusMap[task.value.taskStatus] || task.value.taskStatus;
});

const activeStep = computed(() => {
  if (!task.value) return 0;
  // Map progress percent to steps roughly
  const p = task.value.progressPercent;
  if (p < 5) return 0;
  if (p < 30) return 1;
  if (p < 60) return 2;
  if (p < 90) return 3;
  if (p >= 100) return 5;
  return 3;
});

onMounted(() => {
  if (!taskId) {
    ElMessage.error('任务ID缺失');
    router.push('/dataanalysis/export');
    return;
  }
  
  fetchTask();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});

function startPolling() {
  timer.value = setInterval(() => {
    fetchTask(false);
  }, 3000);
}

function stopPolling() {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
}

function fetchTask(showLoading = true) {
  if (showLoading) loading.value = true;
  getExportTask(taskId).then(res => {
    task.value = res.data;
    loading.value = false;
    
    const status = statusMap[task.value.taskStatus] || task.value.taskStatus;
    
    // Stop polling if terminal state
    if (['success', 'failed', 'cancelled'].includes(status)) {
      stopPolling();
      if (status === 'success') {
        ElMessage.success('导出完成，请下载文件');
      } else if (status === 'failed') {
        ElMessage.error('导出失败: ' + (task.value.errorMessage || '未知错误'));
      }
    }
  }).catch(() => {
    loading.value = false;
    stopPolling();
  });
}

function handleCancel() {
  ElMessageBox.confirm('确定要取消当前正在进行的导出任务吗？', '警告', {
    confirmButtonText: '确定取消',
    cancelButtonText: '继续等待',
    type: 'warning'
  }).then(() => {
    cancelExportTask(taskId).then(() => {
      ElMessage.success('任务取消请求已提交');
      fetchTask(); // Refresh immediately
    });
  });
}

function handleDownload() {
  downloadExportFile(taskId).then(res => {
    const blob = new Blob([res]);
    const fileName = `export_${task.value.taskId}_${new Date().getTime()}.bak`;
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(link.href);
    ElMessage.success('开始下载...');
  });
}

function goBack() {
  router.push('/dataanalysis/export');
}

function getStatusLabel(status) {
  const map = {
    'pending': '等待中',
    'processing': '正在导出...',
    'success': '导出成功',
    'failed': '导出失败',
    'cancelled': '已取消'
  };
  return map[status] || status;
}

function getStatusDesc(status) {
  const map = {
    'pending': '任务已提交，等待执行...',
    'processing': '系统正在处理您的数据导出请求，请稍候...',
    'success': '数据已成功导出，请点击下方按钮下载。',
    'failed': '导出过程中发生错误。',
    'cancelled': '任务已被用户手动取消。'
  };
  return map[status] || '';
}

function getProgressStatus(status) {
  if (status === 'success') return 'success';
  if (status === 'failed' || status === 'cancelled') return 'exception';
  return '';
}
</script>

<style lang="scss" scoped>
.progress-page {
  display: flex;
  justify-content: center;
  padding-top: 50px;
  
  .progress-card {
    width: 800px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .task-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 40px 40px;

      .status-title {
        font-size: 22px;
        margin-bottom: 8px;
        margin-top: 0;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      .status-desc {
        color: var(--el-text-color-secondary);
        font-size: 14px;
        margin-bottom: 32px;
      }
      
      .progress-container {
        display: flex;
        justify-content: space-around;
        align-items: center;
        width: 100%;
        margin-bottom: 30px;
        gap: 60px;

        .steps-container {
          flex: 1;
          max-width: 360px;
          text-align: left;

          :deep(.el-step__main) {
            padding-bottom: 12px;
          }

          :deep(.el-step__title) {
            font-size: 15px;
            line-height: 26px;
          }

          :deep(.el-step__description) {
            padding-right: 10px;
            margin-top: 6px;
            padding-bottom: 8px;
          }
        }

        .percentage-value {
          display: block;
          margin-top: 8px;
          font-size: 32px;
          font-weight: 600;
        }

        .percentage-label {
          display: block;
          margin-top: 8px;
          font-size: 13px;
          color: var(--el-text-color-secondary);
        }
      }
      
      .current-action {
        background-color: var(--el-fill-color-light);
        padding: 10px 20px;
        border-radius: 4px;
        width: 100%;
        text-align: center;
        margin-bottom: 20px;
        
        .label {
          color: var(--el-text-color-secondary);
          margin-right: 10px;
        }
        .value {
          font-weight: bold;
          color: var(--el-color-primary);
        }
      }
    }
  }
}
</style>

