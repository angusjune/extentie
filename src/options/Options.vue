<script setup lang="ts">
import { onMounted } from 'vue';
import { t } from '../lib/i18n';
import { useSettings } from '../composables/useSettings';

const { searchEnabled, load } = useSettings();

onMounted(() => {
  void load();
});
</script>

<template>
  <form class="options">
    <label class="options__row" for="search-toggle">
      <input id="search-toggle" v-model="searchEnabled" class="checkbox-native" type="checkbox" />
      <span class="checkbox-indicator" role="presentation">
        <svg
          width="10"
          height="8"
          viewBox="0 0 10 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M1 3L4 6L9 1" stroke="#fff" stroke-width="2" />
        </svg>
      </span>
      {{ t('show_search_bar') }}
    </label>
  </form>
</template>

<style scoped lang="scss">
.options {
  padding: 16px;
}

.options__row {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}
</style>
