<template>
  <el-dialog
    v-model="visible"
    title="Excel数据导出确认"
    width="500px"
    :close-on-click-modal="false"
  >
    <div class="export-info">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="数据源">
          {{ datasourceName }}
        </el-descriptions-item>
        <el-descriptions-item label="导出类型">
          <el-tag :type="exportType === 'selected' ? 'primary' : 'success'">
            {{ exportType === 'selected' ? '选中导出' : '全部导出' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="导出记录数">
          <span class="record-count">{{ recordCount }} 条</span>
        </el-descriptions-item>
        <el-descriptions-item label="涉及单位" v-if="unitNames.length > 0">
          <el-tag v-for="name in unitNames.slice(0, 3)" :key="name" size="small" class="unit-tag">
            {{ name }}
          </el-tag>
          <span v-if="unitNames.length > 3" class="more-units">
            等 {{ unitNames.length }} 个单位
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="导出格式">
          <el-tag type="warning">
            <el-icon><Document /></el-icon>
            Excel文件 (.xlsx)
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <!-- Sheet页说明 -->
      <div class="sheet-info">
        <div class="sheet-title">
          <el-icon><Files /></el-icon>
          包含 16 个Sheet页
        </div>
        <div class="sheet-list">
          <el-tag
            v-for="sheet in sheetNames"
            :key="sheet"
            size="small"
            type="info"
            class="sheet-tag"
          >
            {{ sheet }}
          </el-tag>
        </div>
      </div>

      <!-- 提示信息 -->
      <el-alert
        v-if="recordCount > 5000"
        title="数据量较大，导出可能需要较长时间"
        type="warning"
        :closable="false"
        show-icon
      />
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleConfirm">
        确认导出
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Document, Files } from '@element-plus/icons-vue'

const props = defineProps({
  datasourceName: String,
  exportType: String,    // 'selected' | 'all'
  recordCount: Number,
  unitNames: Array
})

const emit = defineEmits(['confirm', 'cancel'])

const visible = ref(false)
const loading = ref(false)

// 16个Sheet页名称
const sheetNames = [
  '电子数据信息', '单位信息', '辅助信息', '辅助余额',
  '辅助余额期初', '会计科目', '科目辅助核算', '会计期间',
  '科目设置', '科目余额', '科目余额明细', '科目余额期初',
  '凭证辅助明细', '凭证库', '全年辅助余额', '未记账凭证'
]

function open() {
  visible.value = true
}

function handleCancel() {
  visible.value = false
  emit('cancel')
}

function handleConfirm() {
  loading.value = true
  emit('confirm', (taskId) => {
    loading.value = false
    if (taskId) {
      visible.value = false
    }
  })
}

defineExpose({ open })
</script>

<style lang="scss" scoped>
.export-info {
  .record-count {
    font-size: 18px;
    font-weight: bold;
    color: var(--el-color-primary);
  }

  .unit-tag {
    margin-right: 4px;
  }

  .more-units {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.sheet-info {
  margin-top: 16px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;

  .sheet-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-weight: bold;
  }

  .sheet-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .sheet-tag {
    font-size: 11px;
  }
}
</style>
