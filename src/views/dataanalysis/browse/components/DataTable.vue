<template>
  <div class="data-table">
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="dataList"
      @select="handleSelect"
      @select-all="handleSelectAll"
      row-key="electronicDataCode"
      height="calc(100vh - 350px)"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="电子数据编号" align="center" prop="electronicDataCode" width="180" show-overflow-tooltip />
      <el-table-column label="电子数据名称" align="center" prop="electronicDataName" min-width="200" show-overflow-tooltip />
      <el-table-column label="年度" align="center" prop="year" width="80" />
      <el-table-column label="单位编号" align="center" prop="unitCode" width="100" />
      <el-table-column label="单位名称" align="center" prop="unitName" min-width="150" show-overflow-tooltip />
      <el-table-column label="行业名称" align="center" prop="industryName" width="180" show-overflow-tooltip />
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="pageNum"
      v-model:limit="pageSize"
      @pagination="handlePagination"
    />
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue';

const props = defineProps({
  dataList: {
    type: Array,
    default: () => []
  },
  loading: Boolean,
  total: Number,
  page: Number,
  limit: Number,
  selectedIds: {
    type: Set,
    default: () => new Set()
  }
});

const emit = defineEmits(['update:page', 'update:limit', 'pagination', 'selection-change']);

const tableRef = ref(null);

const pageNum = computed({
  get: () => props.page,
  set: (val) => emit('update:page', val)
});

const pageSize = computed({
  get: () => props.limit,
  set: (val) => emit('update:limit', val)
});

// Watch dataList changes to restore selection
watch(() => props.dataList, (newVal) => {
  nextTick(() => {
    if (tableRef.value) {
      newVal.forEach(row => {
        if (props.selectedIds.has(row.electronicDataCode)) {
          tableRef.value.toggleRowSelection(row, true);
        }
      });
    }
  });
}, { deep: true });

// Watch selectedIds changes to clear selection when empty
watch(() => props.selectedIds.size, (newSize) => {
  if (newSize === 0) {
    nextTick(() => {
      if (tableRef.value) {
        tableRef.value.clearSelection();
      }
    });
  }
});

function handleSelect(selection, row) {
  const isSelected = selection.some(item => item.electronicDataCode === row.electronicDataCode);
  emit('selection-change', { type: 'single', row, isSelected });
}

function handleSelectAll(selection) {
  const isSelected = selection.length > 0;
  emit('selection-change', { type: 'all', rows: props.dataList, isSelected });
}

function handlePagination(params) {
  emit('pagination', params);
}
</script>

<style scoped>
.data-table {
  background-color: var(--el-bg-color);
  padding: 10px;
  border-radius: 4px;
}
</style>

