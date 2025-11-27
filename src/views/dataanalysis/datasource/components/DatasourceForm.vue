<template>
  <el-dialog :title="title" v-model="visible" width="600px" append-to-body custom-class="tech-dialog">
    <el-form ref="datasourceRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="数据源名称" prop="datasourceName">
        <el-input v-model="form.datasourceName" placeholder="请输入数据源名称" />
      </el-form-item>
      <el-row>
        <el-col :span="8">
          <el-form-item label="数据库类型" prop="dbType">
            <el-select v-model="form.dbType" placeholder="请选择类型" disabled>
              <el-option label="SQL Server" value="sqlserver" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="显示顺序" prop="sortOrder">
            <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="form.status">
              <el-radio
                v-for="dict in sys_normal_disable"
                :key="dict.value"
                :label="dict.value"
              >{{ dict.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="16">
          <el-form-item label="主机地址" prop="dbHost">
            <el-input v-model="form.dbHost" placeholder="请输入主机地址 (IP)" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="端口" prop="dbPort">
            <el-input-number v-model="form.dbPort" :min="1" :max="65535" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="数据库名" prop="dbName">
        <el-input v-model="form.dbName" placeholder="请输入数据库名称" />
      </el-form-item>
      <el-row>
        <el-col :span="12">
          <el-form-item label="用户名" prop="dbUsername">
            <el-input v-model="form.dbUsername" placeholder="请输入用户名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="密码" prop="dbPassword">
            <el-input
              v-model="form.dbPassword"
              type="password"
              :placeholder="form.datasourceId ? '为空则不修改密码' : '请输入密码'"
              show-password
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitForm" :loading="loading">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, getCurrentInstance } from 'vue'
import { addDatasource, updateDatasource } from "@/api/dataanalysis/datasource"

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict("sys_normal_disable")

const props = defineProps({
  modelValue: Boolean,
  title: String,
  formData: Object
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const datasourceRef = ref(null)

const form = ref({
  datasourceId: undefined,
  datasourceName: undefined,
  dbType: 'sqlserver',
  dbHost: undefined,
  dbPort: 1433,
  dbName: undefined,
  dbUsername: undefined,
  dbPassword: undefined,
  status: "0",
  sortOrder: 0,
  remark: undefined
})

const rules = {
  datasourceName: [
    { required: true, message: "数据源名称不能为空", trigger: "blur" }
  ],
  dbHost: [
    { required: true, message: "主机地址不能为空", trigger: "blur" }
  ],
  dbPort: [
    { required: true, message: "端口不能为空", trigger: "blur" }
  ],
  dbName: [
    { required: true, message: "数据库名称不能为空", trigger: "blur" }
  ],
  dbUsername: [
    { required: true, message: "用户名不能为空", trigger: "blur" }
  ],
  sortOrder: [
    { required: true, message: "显示顺序不能为空", trigger: "blur" },
    { type: 'number', min: 0, message: "显示顺序必须大于或等于0", trigger: "blur" }
  ],
  dbPassword: [
    {
      required: true,
      trigger: "blur",
      validator: (rule, value, callback) => {
        if (!form.value.datasourceId && !value) {
          callback(new Error("请输入密码"))
        } else {
          callback()
        }
      }
    }
  ]
}

// 监听 formData 变化以初始化表单
import { watch } from 'vue'
watch(() => props.formData, (val) => {
  if (val) {
    form.value = { ...val, dbPassword: '' } // 密码置空
  } else {
    reset()
  }
}, { immediate: true })

function reset() {
  form.value = {
    datasourceId: undefined,
    datasourceName: undefined,
    dbType: 'sqlserver',
    dbHost: undefined,
    dbPort: 1433,
    dbName: undefined,
    dbUsername: undefined,
    dbPassword: undefined,
    status: "0",
    sortOrder: 0,
    remark: undefined
  }
  proxy.resetForm("datasourceRef")
}

function cancel() {
  visible.value = false
  reset()
}

function submitForm() {
  proxy.$refs["datasourceRef"].validate(valid => {
    if (valid) {
      loading.value = true
      if (form.value.datasourceId != undefined) {
        updateDatasource(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          visible.value = false
          emit('success')
        }).finally(() => loading.value = false)
      } else {
        addDatasource(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功")
          visible.value = false
          emit('success')
        }).finally(() => loading.value = false)
      }
    }
  })
}
</script>
