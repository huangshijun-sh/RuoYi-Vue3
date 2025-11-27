<template>
  <div class="datasource-card tech-card" @click="$emit('click')">
    <!-- 装饰背景 -->
    <div class="card-bg-decoration"></div>
    
    <div class="card-header">
      <div class="header-left">
        <div class="icon-wrapper">
          <!-- 数据库类型图标，如果图标不存在会回退到默认 -->
          <svg-icon :icon-class="getDbIcon(datasource.dbType)" class-name="db-icon" />
        </div>
        <div class="header-info">
          <span class="title" :title="datasource.datasourceName">{{ datasource.datasourceName }}</span>
          <span class="subtitle">{{ datasource.dbType }}</span>
        </div>
      </div>
      <div class="header-right">
        <el-tag
          :type="getStatusType()"
          size="small"
          effect="dark"
          class="status-tag"
        >
          {{ getStatusText() }}
        </el-tag>
        <div class="sort-badge" v-if="datasource.sortOrder !== undefined">{{ datasource.sortOrder }}</div>
      </div>
    </div>
    
    <div class="card-body">
      <div class="info-row">
        <div class="info-item">
          <span class="label">
            <el-icon><Monitor /></el-icon> 主机
          </span>
          <span class="value highlight" :title="datasource.dbHost">{{ datasource.dbHost }}</span>
        </div>
        <div class="info-item port">
          <span class="label">
            <el-icon><Sort /></el-icon> 端口
          </span>
          <span class="value">{{ datasource.dbPort }}</span>
        </div>
      </div>
      <div class="info-row">
        <div class="info-item full-width">
          <span class="label">
            <el-icon><Coin /></el-icon> 库名
          </span>
          <span class="value" :title="datasource.dbName">{{ datasource.dbName }}</span>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <div class="action-btn" @click.stop="handleTest" :class="{ 'is-loading': testing }">
        <el-icon v-if="testing" class="is-loading"><Loading /></el-icon>
        <el-icon v-else><Connection /></el-icon>
        <span>测试</span>
      </div>
      <div class="divider"></div>
      <div class="action-btn" @click.stop="$emit('edit', datasource)">
        <el-icon><Edit /></el-icon>
        <span>编辑</span>
      </div>
      <div class="divider"></div>
      <div class="action-btn danger" @click.stop="$emit('delete', datasource)">
        <el-icon><Delete /></el-icon>
        <span>删除</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineOptions } from 'vue'
import { Connection, Edit, Delete, Loading, Monitor, Sort, Coin } from '@element-plus/icons-vue'

defineOptions({
  name: 'DatasourceCard',
  components: {
    Connection,
    Edit,
    Delete,
    Loading,
    Monitor,
    Sort,
    Coin
  }
})

const props = defineProps({
  datasource: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click', 'edit', 'delete', 'test'])
const testing = ref(false)

function handleTest() {
  testing.value = true
  emit('test', props.datasource, () => {
    testing.value = false
  })
}

function getDbIcon(type) {
  // 由于缺少特定数据库图标，暂时统一使用 druid 图标，或者根据类型返回存在的图标
  if (!type) return 'druid'
  const lowerType = type.toLowerCase()
  if (lowerType.includes('redis')) return 'redis'
  // 列表里有 server.svg, druid.svg 等
  return 'druid'
}

function getStatusType() {
  // 优先显示测试连接的状态
  if (props.datasource.connectionStatus === 'connected') {
    return 'success'
  } else if (props.datasource.connectionStatus === 'disconnected') {
    return 'danger'
  }
  // 未测试时显示为 info 类型
  return 'info'
}

function getStatusText() {
  // 优先显示测试连接的状态
  if (props.datasource.connectionStatus === 'connected') {
    return '已连接'
  } else if (props.datasource.connectionStatus === 'disconnected') {
    return '断开'
  }
  // 未测试时显示"未测试"
  return '未测试'
}
</script>

<style lang="scss" scoped>
@import "@/assets/styles/tech-theme.scss";

.datasource-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  background: linear-gradient(145deg, rgba(21, 30, 50, 0.6) 0%, rgba(11, 17, 32, 0.7) 100%);
  border: 1px solid rgba(0, 242, 255, 0.15);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  // 装饰背景
  .card-bg-decoration {
    position: absolute;
    top: -50px;
    right: -50px;
    width: 150px;
    height: 150px;
    background: radial-gradient(circle, rgba(0, 242, 255, 0.1) 0%, transparent 70%);
    border-radius: 50%;
    z-index: 0;
    transition: all 0.5s ease;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 242, 255, 0.15);
    border-color: rgba(0, 242, 255, 0.5);
    
    .card-bg-decoration {
      transform: scale(1.2);
      opacity: 0.8;
    }
    
    .card-header .icon-wrapper {
      box-shadow: 0 0 15px rgba(0, 242, 255, 0.4);
      border-color: $tech-primary;
      transform: rotate(10deg);
    }
  }
  
  .card-header {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 20px 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    .header-left {
      display: flex;
      align-items: center;
      overflow: hidden;
      
      .icon-wrapper {
        width: 48px;
        height: 48px;
        background: rgba(11, 17, 32, 0.6);
        border: 1px solid rgba(0, 242, 255, 0.2);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
        transition: all 0.3s ease;
        flex-shrink: 0;
        
        .db-icon {
          font-size: 28px;
          color: $tech-primary;
          filter: drop-shadow(0 0 2px rgba(0, 242, 255, 0.5));
        }
      }

      .header-info {
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .title {
          font-size: 16px;
          font-weight: 600;
          color: $tech-text-main;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0.5px;
        }
        
        .subtitle {
          font-size: 12px;
          color: $tech-text-sub;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 4px;
          align-self: flex-start;
          text-transform: uppercase;
          font-weight: bold;
          letter-spacing: 1px;
        }
      }
    }

    .header-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }

    .status-tag {
      flex-shrink: 0;
      font-weight: bold;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }

    .sort-badge {
      min-width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(0, 242, 255, 0.15) 0%, rgba(0, 200, 255, 0.1) 100%);
      border: 1px solid rgba(0, 242, 255, 0.3);
      border-radius: 6px;
      color: $tech-primary;
      font-size: 12px;
      font-weight: bold;
      font-family: 'JetBrains Mono', 'Consolas', monospace;
      padding: 0 6px;
      box-shadow: 0 2px 8px rgba(0, 242, 255, 0.2);
    }
  }

  .card-body {
    position: relative;
    z-index: 1;
    flex: 1;
    padding: 15px 20px;
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }

    .info-item {
      display: flex;
      flex-direction: column;
      
      &.full-width {
        width: 100%;
      }
      
      &.port {
        align-items: flex-end;
        min-width: 60px;
      }
      
      .label {
        color: rgba(255, 255, 255, 0.4);
        font-size: 12px;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .value {
        color: $tech-text-main;
        font-family: 'JetBrains Mono', 'Consolas', monospace;
        font-size: 14px;
        letter-spacing: 0.5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        
        &.highlight {
          color: lighten($tech-primary, 10%);
          text-shadow: 0 0 5px rgba(0, 242, 255, 0.3);
        }
      }
    }
  }

  .card-footer {
    position: relative;
    z-index: 1;
    padding: 12px 0;
    background: rgba(0, 0, 0, 0.2);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-around;
    align-items: center;
    transition: background 0.3s ease;

    .divider {
      width: 1px;
      height: 16px;
      background: rgba(255, 255, 255, 0.1);
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px 15px;
      border-radius: 6px;
      color: $tech-text-sub;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      .el-icon {
        font-size: 16px;
        color: inherit;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      &:hover {
        color: $tech-primary;
        background: rgba(0, 242, 255, 0.1);
        text-shadow: 0 0 8px $tech-primary;
      }
      
      &.danger:hover {
        color: $tech-danger;
        background: rgba(255, 77, 77, 0.1);
        text-shadow: 0 0 8px $tech-danger;
      }
      
      &.is-loading {
        opacity: 0.7;
        pointer-events: none;
      }
    }
  }
}
</style>
