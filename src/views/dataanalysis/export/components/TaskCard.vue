<template>
  <el-card shadow="hover" class="task-card tech-theme-card">
    <div class="card-header">
      <div class="task-title">
        <span class="task-id">#{{ task.taskId }}</span>
        <span class="task-type">{{ getExportTypeLabel(task.exportType) }}</span>
      </div>
      <el-tag :type="getStatusType(taskStatus)" effect="dark" class="status-tag">
        {{ getStatusLabel(taskStatus) }}
      </el-tag>
    </div>
    
    <div class="card-body">
      <div class="info-item">
        <span class="label">数据源:</span>
        <span class="value">{{ task.datasourceName || '-' }}</span>
      </div>
      <div class="info-item">
        <span class="label">导出格式:</span>
        <span class="value">
          <el-tag v-if="task.exportFormat === 'excel'" type="success" size="small" effect="plain">Excel</el-tag>
          <el-tag v-else-if="task.exportFormat === 'bak' || !task.exportFormat" type="warning" size="small" effect="plain">备份文件</el-tag>
          <span v-else>{{ task.exportFormat }}</span>
        </span>
      </div>
      <div class="info-item">
        <span class="label">记录数:</span>
        <span class="value">{{ task.totalRecords || '-' }}</span>
      </div>
      <div class="info-item unit-name">
        <span class="label">单位名称:</span>
        <span class="value">{{ formatUnitNames(task.unitNames) }}</span>
      </div>
      <div class="info-item">
        <span class="label">创建时间:</span>
        <span class="value">{{ task.createTime }}</span>
      </div>
      
      <div v-if="taskStatus === 'processing'" class="progress-section">
        <el-progress
          :percentage="task.progressPercent"
          :status="taskStatus === 'failed' ? 'exception' : ''"
          :stroke-width="6"
        />
        <div class="progress-text">{{ task.progressSteps }}</div>
      </div>
    </div>

    <div class="card-footer">
      <el-button
        v-if="taskStatus === 'success'"
        type="primary"
        link
        icon="Download"
        @click="$emit('download', task)"
      >
        下载
      </el-button>
      <el-button
        v-if="taskStatus === 'processing'"
        type="danger"
        link
        icon="VideoPause"
        @click="$emit('cancel', task)"
      >
        取消
      </el-button>
      <el-button
        v-if="['success', 'failed', 'cancelled'].includes(taskStatus)"
        type="danger"
        link
        icon="Delete"
        @click="$emit('delete', task)"
      >
        删除
      </el-button>
      <el-button
        v-if="taskStatus === 'processing'"
        type="info"
        link
        icon="View"
        @click="$emit('view', task)"
      >
        查看进度
      </el-button>
      <el-button
        v-if="['success', 'failed'].includes(taskStatus)"
        type="info"
        link
        icon="Document"
        @click="$emit('viewLog', task)"
      >
        查看日志
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
});

defineEmits(['download', 'cancel', 'delete', 'view', 'viewLog']);

// 将后端数字状态码转换为字符串状态
// 0-待处理 1-进行中 2-已完成 3-失败 4-已取消
const taskStatus = computed(() => {
  const statusMap = {
    '0': 'pending',
    '1': 'processing',
    '2': 'success',
    '3': 'failed',
    '4': 'cancelled'
  };
  return statusMap[props.task.taskStatus] || props.task.taskStatus;
});

function getExportTypeLabel(type) {
  const map = {
    '1': '选中导出',
    '2': '全部导出',
    'selected': '选中导出',
    'all': '全部导出'
  };
  return map[type] || type;
}

function getStatusType(status) {
  const map = {
    'pending': 'info',
    'processing': 'primary',
    'success': 'success',
    'failed': 'danger',
    'cancelled': 'warning'
  };
  return map[status] || 'info';
}

function getStatusLabel(status) {
  const map = {
    'pending': '等待中',
    'processing': '进行中',
    'success': '已完成',
    'failed': '失败',
    'cancelled': '已取消'
  };
  return map[status] || status;
}

// 格式化单位名称显示
function formatUnitNames(unitNamesJson) {
  if (!unitNamesJson) return '-';
  try {
    const unitNames = JSON.parse(unitNamesJson);
    if (!Array.isArray(unitNames) || unitNames.length === 0) return '-';
    if (unitNames.length > 3) {
      return unitNames.slice(0, 3).join('，') + '等';
    }
    return unitNames.join('，');
  } catch (e) {
    return '-';
  }
}
</script>

<style lang="scss" scoped>
.task-card {
  margin-bottom: 20px;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    
    .task-title {
      font-weight: bold;
      
      .task-id {
        color: var(--el-text-color-secondary);
        margin-right: 8px;
        font-family: monospace;
      }
    }
  }
  
  .card-body {
    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
      font-size: 14px;
      line-height: 1.5;

      .label {
        color: var(--el-text-color-secondary);
        white-space: nowrap;
        flex-shrink: 0;
        margin-right: 12px;
      }

      .value {
        text-align: right;
        flex: 1;
        word-break: break-word;
      }

      &.unit-name .value {
        text-align: left;
      }
    }
    
    .progress-section {
      margin-top: 15px;
      
      .progress-text {
        font-size: 12px;
        color: var(--el-color-primary);
        margin-top: 5px;
        text-align: center;
      }
    }
  }
  
  .card-footer {
    margin-top: 15px;
    padding-top: 10px;
    border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}

// Tech theme enhancements (if tech-theme.scss is global)
.tech-theme-card {
  border: 1px solid rgba(0, 150, 255, 0.1);
  background: rgba(255, 255, 255, 0.95);
  
  :deep(.el-card__body) {
    padding: 15px;
  }
}
</style>

