<script setup lang="ts">
import type { ExtGroupView } from '../composables/useExtensions';
import ExtItem from './ExtItem.vue';

defineProps<{ group: ExtGroupView }>();
</script>

<template>
  <section v-if="group.items.length > 0" class="group">
    <header class="group__header">
      <h2 class="group__title">{{ group.title }}</h2>
      <p class="group__count">{{ group.enabledCount }}/{{ group.totalCount }}</p>
    </header>
    <ul class="group__list">
      <ExtItem v-for="ext in group.items" :key="ext.id" :ext="ext" />
    </ul>
  </section>
</template>

<style scoped lang="scss">
.group__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: default;
}

.group__title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
}

.group__count {
  margin: 0;
  font-size: 1rem;
  color: var(--secondary);
}

.group__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
