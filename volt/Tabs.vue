<template>
    <!-- @vue-ignore -->
    <Tabs
        unstyled
        :pt="theme"
        :ptOptions="{
            mergeProps: ptViewMerge
        }"
    >
        <slot></slot>
    </Tabs>
</template>

<script setup lang="ts">
import Tabs, { type TabsPassThroughOptions } from 'primevue/tabs';
import { ref } from 'vue';
import { ptViewMerge } from './utils'; 

const theme = ref<TabsPassThroughOptions>({
    root: `flex flex-col`
});
</script>