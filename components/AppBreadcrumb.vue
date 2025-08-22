<template>
  <nav class="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
    <!-- Home 图标 -->
    <router-link 
      v-if="showHome" 
      :to="homeRoute" 
      :class="homeLinkClasses"
      :aria-label="homeLabel"
    >
      <i :class="homeIcon" class="text-base"></i>
    </router-link>
    
    <!-- 分隔符 -->
    <i v-if="showHome && items && items.length > 0" :class="[separatorIcon, separatorClasses]"></i>
    
    <!-- 面包屑项目 -->
    <template v-for="(item, index) in items || []" :key="index">
      <!-- 可点击的项目 -->
      <router-link 
        v-if="item.route && index < (items?.length || 0) - 1" 
        :to="item.route" 
        :class="linkClasses"
      >
        <i v-if="item.icon" :class="item.icon" class="mr-1"></i>
        {{ item.label }}
      </router-link>
      
      <!-- 当前页面（不可点击） -->
      <span 
        v-else 
        :class="currentPageClasses"
        :aria-current="index === (items?.length || 0) - 1 ? 'page' : undefined"
      >
        <i v-if="item.icon" :class="item.icon" class="mr-1"></i>
        {{ item.label }}
      </span>
      
      <!-- 分隔符 -->
      <i 
        v-if="index < (items?.length || 0) - 1" 
        :class="[separatorIcon, separatorClasses]"
      ></i>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLayout } from '../composables/use-layout';
import type { BreadcrumbItem, BreadcrumbProps } from '../types';

const props = withDefaults(defineProps<BreadcrumbProps>(), {
  items: () => [], // Add default empty array
  showHome: true,
  homeRoute: '/',
  homeIcon: 'pi pi-home',
  homeLabel: '首页',
  separatorIcon: 'pi pi-angle-right'
});

const { primary, isDarkMode } = useLayout();

// 计算动态样式类
const homeLinkClasses = computed(() => {
  const baseClasses = 'flex items-center transition-colors duration-200';
  const lightClasses = `text-gray-500 hover:text-${primary.value}-600`;
  const darkClasses = `dark:text-gray-400 dark:hover:text-${primary.value}-400`;
  return `${baseClasses} ${lightClasses} ${darkClasses}`;
});

const linkClasses = computed(() => {
  const baseClasses = 'transition-colors duration-200 font-medium';
  const lightClasses = `text-gray-500 hover:text-${primary.value}-600`;
  const darkClasses = `dark:text-gray-400 dark:hover:text-${primary.value}-400`;
  return `${baseClasses} ${lightClasses} ${darkClasses}`;
});

const currentPageClasses = computed(() => {
  const baseClasses = 'font-medium';
  const lightClasses = `text-${primary.value}-600`;
  const darkClasses = `dark:text-${primary.value}-400`;
  return `${baseClasses} ${lightClasses} ${darkClasses}`;
});

const separatorClasses = computed(() => {
  return 'text-gray-400 dark:text-gray-500 text-xs';
});
</script>