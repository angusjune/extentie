<script setup lang="ts">
import { t } from '../lib/i18n';

defineProps<{ modelValue: string }>();
defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <div class="search" role="search">
    <div class="kd-textfield">
      <input
        class="kd-textfield__input"
        type="search"
        autocomplete="off"
        autofocus
        :aria-label="t('search')"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <span class="kd-textfield__leading-icon">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z"
          />
        </svg>
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.search {
  position: fixed;
  z-index: 1;
  box-sizing: border-box;
  width: 100%;
  height: 60px;
  padding: 16px;
  background: var(--bg);
}
</style>
