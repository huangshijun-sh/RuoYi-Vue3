<template>
  <div class="app-container tech-theme-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="名称" prop="datasourceName">
        <el-input
          v-model="queryParams.datasourceName"
          placeholder="请输入数据源名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="主机" prop="dbHost">
        <el-input
          v-model="queryParams.dbHost"
          placeholder="请输入主机地址"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="数据源状态" clearable style="width: 100px">
          <el-option
            v-for="dict in sys_normal_disable"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
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

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['data:datasource:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['data:datasource:remove']"
          v-if="viewMode === 'table'"
        >删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 表格视图 -->
    <div v-if="viewMode === 'table'">
      <el-table v-loading="loading" :data="datasourceList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="显示顺序" align="center" prop="sortOrder" width="100" />
        <el-table-column label="数据源名称" align="center" prop="datasourceName" :show-overflow-tooltip="true" />
        <el-table-column label="类型" align="center" prop="dbType" width="100">
          <template #default="scope">
            <el-tag type="info">{{ scope.row.dbType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="主机" align="center" prop="dbHost" :show-overflow-tooltip="true" />
        <el-table-column label="端口" align="center" prop="dbPort" width="80" />
        <el-table-column label="数据库名" align="center" prop="dbName" :show-overflow-tooltip="true" />
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <!-- 优先显示测试连接的状态 -->
            <el-tag v-if="scope.row.connectionStatus === 'connected'" type="success">已连接</el-tag>
            <el-tag v-else-if="scope.row.connectionStatus === 'disconnected'" type="danger">断开</el-tag>
            <!-- 未测试时显示"未测试" -->
            <el-tag v-else type="info">未测试</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="160">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="220">
          <template #default="scope">
            <el-button
              link
              type="primary"
              icon="Connection"
              @click="handleTest(scope.row)"
              v-hasPermi="['data:datasource:test']"
            >测试</el-button>
            <el-button
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['data:datasource:edit']"
            >修改</el-button>
            <el-button
              link
              type="primary"
              icon="Delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['data:datasource:remove']"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 卡片视图 -->
    <div v-else v-loading="loading" class="card-container">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in datasourceList" :key="item.datasourceId">
          <div class="card-wrapper">
            <datasource-card 
              :datasource="item" 
              @edit="handleUpdate"
              @delete="handleDelete"
              @test="handleTest"
            />
          </div>
        </el-col>
      </el-row>
      <el-empty v-if="datasourceList.length === 0" description="暂无数据源" />
    </div>

    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      :page-sizes="[12, 24, 36, 60]"
      @pagination="getList"
    />

    <!-- 添加或修改对话框 -->
    <datasource-form
      v-model="open"
      :title="title"
      :form-data="form"
      @success="getList"
    />
  </div>
</template>

<script setup name="Datasource">
import { ref, reactive, toRefs, getCurrentInstance } from 'vue'
import { listDatasource, getDatasource, delDatasource, testDatasource } from "@/api/dataanalysis/datasource"
import DatasourceCard from './components/DatasourceCard.vue'
import DatasourceForm from './components/DatasourceForm.vue'
import { Notebook, Menu } from '@element-plus/icons-vue'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict("sys_normal_disable")

const viewMode = ref('card') // 默认卡片视图
const datasourceList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const form = ref({})

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 12, // 卡片视图每页多一点
    datasourceName: undefined,
    dbHost: undefined,
    status: '0' // 默认查询正常状态的数据源
  }
})

const { queryParams } = toRefs(data)

/** 查询数据源列表 */
function getList() {
  loading.value = true
  listDatasource(queryParams.value).then(response => {
    // 初始化每个数据源的连接状态为 undefined（未测试）
    datasourceList.value = response.rows.map(item => ({
      ...item,
      connectionStatus: undefined
    }))
    total.value = response.total
    loading.value = false

    // 自动测试所有数据源的连接状态
    autoTestAllDatasources()
  })
}

/** 自动测试所有数据源 */
function autoTestAllDatasources() {
  datasourceList.value.forEach(datasource => {
    testDatasource(datasource.datasourceId).then(() => {
      // 测试成功
      datasource.connectionStatus = 'connected'
    }).catch(() => {
      // 测试失败
      datasource.connectionStatus = 'disconnected'
    })
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.datasourceId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  form.value = undefined
  open.value = true
  title.value = "添加数据源"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  const datasourceId = row.datasourceId || ids.value
  getDatasource(datasourceId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改数据源"
  })
}

/** 测试连接操作 */
function handleTest(row, callback) {
  const datasourceId = row.datasourceId
  proxy.$modal.loading("正在测试连接...")

  testDatasource(datasourceId).then(response => {
    proxy.$modal.closeLoading()
    // 更新数据源的连接状态为"已连接"
    row.connectionStatus = 'connected'
    // 后端已返回"连接成功: …"或具体信息,前端直接展示
    proxy.$modal.msgSuccess(response.msg || "连接成功")
  }).catch(error => {
    proxy.$modal.closeLoading()
    // 更新数据源的连接状态为"断开"
    row.connectionStatus = 'disconnected'
    // 处理各种错误情况
    let msg = "连接失败"
    if (error?.response?.data?.msg) {
      msg = error.response.data.msg
    } else if (error?.message) {
      // 处理网络错误和超时
      if (error.message.includes('timeout')) {
        msg = "连接超时：无法连接到数据库服务器，请检查网络和数据库配置"
      } else if (error.message.includes('Network Error')) {
        msg = "网络错误：请检查后端服务是否正常运行"
      } else {
        msg = "连接失败：" + error.message
      }
    }
    proxy.$modal.msgError(msg)
  }).finally(() => {
    if (callback) callback()
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const datasourceIds = row.datasourceId || ids.value
  proxy.$modal.confirm('是否确认删除数据源编号为"' + datasourceIds + '"的数据项？').then(function() {
    return delDatasource(datasourceIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

getList()
</script>

<style lang="scss" scoped>
.card-wrapper {
  min-height: 220px;
  height: auto;
  margin-bottom: 20px;
}

.card-container {
  min-height: 400px;
}
</style>
