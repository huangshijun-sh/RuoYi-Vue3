<template>
  <el-dialog
    v-model="visible"
    :title="`连接日志 - ${datasourceName}`"
    width="900px"
    append-to-body
    @close="handleClose"
  >
    <el-table
      v-loading="loading"
      :data="logList"
      max-height="500"
      border
    >
      <el-table-column label="序号" type="index" width="60" align="center" />
      <el-table-column label="操作时间" align="center" prop="createTime" width="160">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作类型" align="center" prop="operationType" width="100">
        <template #default="scope">
          <el-tag :type="getOperationTypeTag(scope.row.operationType)">
            {{ getOperationTypeText(scope.row.operationType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="结果" align="center" prop="result" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.result === 'success' ? 'success' : 'danger'">
            {{ scope.row.result === 'success' ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="详细信息" align="left" prop="message" :show-overflow-tooltip="true" min-width="250">
        <template #default="scope">
          <span :class="scope.row.result === 'success' ? 'text-success' : 'text-danger'">
            {{ scope.row.message }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作人" align="center" prop="operatorName" width="100" />
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getLogList"
    />

    <template #footer>
      <el-button type="danger" @click="handleCleanLog" v-if="total > 0">清空日志</el-button>
      <el-button @click="handleClose">关 闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, getCurrentInstance } from 'vue'
import { parseTime } from '@/utils/ruoyi'
import { listDatasourceLog, cleanDatasourceLog } from '@/api/dataanalysis/datasource'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  datasourceId: {
    type: [Number, String],
    default: null
  },
  datasourceName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const { proxy } = getCurrentInstance()

const visible = ref(false)
const loading = ref(false)
const logList = ref([])
const total = ref(0)
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  datasourceId: null
})

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val && props.datasourceId) {
    queryParams.value.datasourceId = props.datasourceId
    getLogList()
  }
}, { immediate: true })

watch(visible, (val) => {
  if (!val) {
    emit('update:modelValue', false)
  }
})

function getLogList() {
  loading.value = true
  listDatasourceLog(queryParams.value).then(response => {
    logList.value = response.rows || []
    total.value = response.total || 0
  }).finally(() => {
    loading.value = false
  })
}

function getOperationTypeText(type) {
  const typeMap = {
    'test': '测试连接',
    'create': '创建',
    'update': '更新',
    'delete': '删除'
  }
  return typeMap[type] || type
}

function getOperationTypeTag(type) {
  const tagMap = {
    'test': 'primary',
    'create': 'success',
    'update': 'warning',
    'delete': 'danger'
  }
  return tagMap[type] || 'info'
}

function handleClose() {
  visible.value = false
}

function handleCleanLog() {
  proxy.$modal.confirm('确定要清空该数据源的所有日志吗？').then(() => {
    return cleanDatasourceLog(props.datasourceId)
  }).then(() => {
    proxy.$modal.msgSuccess('日志清空成功')
    getLogList()
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}
</style>
