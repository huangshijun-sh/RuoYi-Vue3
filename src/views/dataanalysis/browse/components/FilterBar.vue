<template>
  <div class="filter-bar">
    <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="68px">
      <el-form-item label="年度" prop="years">
        <el-select
          v-model="queryParams.years"
          placeholder="请选择年度"
          multiple
          clearable
          collapse-tags
          style="width: 170px"
        >
          <el-option
            v-for="item in yearOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="单位编号" prop="unitCode">
        <el-input
          v-model="queryParams.unitCode"
          placeholder="输入单位编号前3位"
          clearable
          maxlength="3"
          style="width: 150px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="电子数据名称" prop="electronicDataName" label-width="100px">
        <el-input
          v-model="queryParams.electronicDataName"
          placeholder="请输入电子数据名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="快速搜索" prop="quickSearch">
        <el-input
          v-model="queryParams.quickSearch"
          placeholder="电子数据编号/名称/单位名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { Search, Refresh } from '@element-plus/icons-vue';

const props = defineProps({
  filterOptions: {
    type: Object,
    default: () => ({ years: [], industries: [] })
  }
});

const emit = defineEmits(['search', 'reset']);

const queryRef = ref(null);
const queryParams = reactive({
  years: [],
  unitCode: '',
  electronicDataName: '',
  quickSearch: ''
});

const yearOptions = computed(() => {
  const years = props.filterOptions.years || [];
  return years.map(year => ({ label: String(year), value: year }));
});

function handleQuery() {
  emit('search', queryParams);
}

function resetQuery() {
  queryParams.years = [];
  queryParams.unitCode = '';
  queryParams.electronicDataName = '';
  queryParams.quickSearch = '';
  emit('reset');
}
</script>

<style scoped>
.filter-bar {
  background-color: var(--el-bg-color);
  padding: 10px 10px 0 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}
</style>

