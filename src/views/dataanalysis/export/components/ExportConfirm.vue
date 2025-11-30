<template>
  <el-dialog
    title="导出确认"
    v-model="visible"
    width="500px"
    append-to-body
    class="tech-theme-dialog"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="confirm-content">
      <el-alert
        title="即将开始数据导出任务"
        type="info"
        :closable="false"
        show-icon
        class="mb-4"
      />

      <el-form label-width="100px" class="mt-2">
        <el-form-item label="数据源">
          <span class="font-bold">{{ datasourceName }}</span>
        </el-form-item>
        <el-form-item label="导出类型">
          <el-tag :type="exportType === 'selected' ? 'primary' : 'success'">
            {{ exportType === 'selected' ? '选中导出' : '全部导出' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="预计记录数">
          <span class="font-bold text-primary">{{ recordCount }}</span> 条
        </el-form-item>
        <el-form-item label="单位名称">
          <span>{{ displayUnitNames }}</span>
        </el-form-item>
        <el-form-item label="导出格式">
          <span>SQL Server 备份文件 (.bak)</span>
        </el-form-item>
      </el-form>

      <div class="warning-text mt-2">
        <i class="el-icon-warning-outline"></i>
        <span>注意：导出过程将在后台运行，生成的文件将保留24小时。</span>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取 消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="loading">
          确认导出
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();

const props = defineProps({
  datasourceName: {
    type: String,
    default: '-'
  },
  recordCount: {
    type: Number,
    default: 0
  },
  exportType: {
    type: String,
    default: 'selected' // 'selected' or 'all'
  },
  unitNames: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['confirm']);

const visible = ref(false);
const loading = ref(false);

const displayUnitNames = computed(() => {
  if (!props.unitNames || props.unitNames.length === 0) {
    return '-';
  }
  if (props.unitNames.length > 3) {
    return props.unitNames.slice(0, 3).join('，') + '等';
  }
  return props.unitNames.join('，');
});

function open() {
  visible.value = true;
}

function close() {
  visible.value = false;
}

function handleConfirm() {
  loading.value = true;
  emit('confirm', (createdTaskId) => {
    loading.value = false;
    if (createdTaskId) {
      // 任务创建成功，显示成功消息
      ElMessage.success({
        message: '导出任务已创建，正在后台执行中...',
        duration: 1500
      });

      // 1秒后关闭对话框并跳转到导出任务列表
      setTimeout(() => {
        visible.value = false;
        router.push('/dataanalysis/export');
      }, 1000);
    } else {
      // 任务创建失败，关闭窗口
      visible.value = false;
    }
  });
}

defineExpose({
  open,
  close
});
</script>

<style lang="scss" scoped>
.font-bold {
  font-weight: bold;
}
.text-primary {
  color: var(--el-color-primary);
}
.mb-4 {
  margin-bottom: 16px;
}
.mt-2 {
  margin-top: 8px;
}
.warning-text {
  font-size: 12px;
  color: var(--el-color-warning);
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px;
  background-color: var(--el-color-warning-light-9);
  border-radius: 4px;
}
</style>

