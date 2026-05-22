<script setup lang="ts">
import { computed } from 'vue';
import type { ExtensionInfo } from '../types';
import { pickIcon } from '../lib/icon';
import { t } from '../lib/i18n';
import { useExtensions } from '../composables/useExtensions';

const props = defineProps<{ ext: ExtensionInfo }>();

const { setEnabled, uninstall, launch, openOptions } = useExtensions();

const name = computed(() => props.ext.shortName || props.ext.name);
const icon = computed(() => pickIcon(props.ext.icons));

/** Disable the checkbox when the user is not allowed to change the state. */
const checkboxDisabled = computed(() =>
  props.ext.enabled ? !props.ext.mayDisable : props.ext.mayEnable === false,
);

const showOptions = computed(() => Boolean(props.ext.optionsUrl) && props.ext.enabled);

function onToggle(event: Event): void {
  void setEnabled(props.ext.id, (event.target as HTMLInputElement).checked);
}
</script>

<template>
  <li
    class="ext-item"
    :class="[
      `ext-item--${ext.installType}`,
      { 'ext-item--inactive': !ext.enabled, 'ext-item--app': ext.isApp },
    ]"
  >
    <label class="ext-item__label" :for="`cb-${ext.id}`">
      <input
        :id="`cb-${ext.id}`"
        class="checkbox-native"
        type="checkbox"
        :checked="ext.enabled"
        :disabled="checkboxDisabled"
        @change="onToggle"
      />
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
      <span class="ext-item__icon" :style="{ backgroundImage: `url(${icon})` }" />
      <span class="ext-item__name">{{ name }}</span>
    </label>

    <div class="ext-item__actions">
      <button
        type="button"
        class="ext-item__action ext-item__action--delete"
        :aria-label="`${t('delete_this')} ${name}`"
        @click="uninstall(ext.id)"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.5 14.25C4.5 15.075 5.175 15.75 6 15.75H12C12.825 15.75 13.5 15.075 13.5 14.25V5.25H4.5V14.25ZM14.25 3H11.625L10.875 2.25H7.125L6.375 3H3.75V4.5H14.25V3Z"
          />
        </svg>
      </button>

      <button
        v-if="ext.isApp"
        type="button"
        class="ext-item__action"
        :aria-label="`${t('launch')} ${name}`"
        @click="launch(ext.id)"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14.25 14.25H3.75V3.75H9V2.25H3.75C2.9175 2.25 2.25 2.925 2.25 3.75V14.25C2.25 15.075 2.9175 15.75 3.75 15.75H14.25C15.075 15.75 15.75 15.075 15.75 14.25V9H14.25V14.25ZM10.5 2.25V3.75H13.1925L5.82 11.1225L6.8775 12.18L14.25 4.8075V7.5H15.75V2.25H10.5Z"
          />
        </svg>
      </button>

      <button
        v-if="showOptions"
        type="button"
        class="ext-item__action"
        :aria-label="`${t('open_option')} ${name}`"
        @click="openOptions(ext.optionsUrl!)"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14.355 9.702C14.382 9.477 14.4 9.243 14.4 9C14.4 8.757 14.382 8.523 14.346 8.298L15.867 7.11C16.002 7.002 16.038 6.804 15.957 6.651L14.517 4.158C14.427 3.996 14.238 3.942 14.076 3.996L12.285 4.716C11.907 4.428 11.511 4.194 11.07 4.014L10.8 2.106C10.773 1.926 10.62 1.8 10.44 1.8H7.55999C7.37999 1.8 7.23599 1.926 7.20899 2.106L6.93899 4.014C6.49799 4.194 6.09299 4.437 5.72399 4.716L3.93299 3.996C3.77099 3.933 3.58199 3.996 3.49199 4.158L2.05199 6.651C1.96199 6.813 1.99799 7.002 2.14199 7.11L3.66299 8.298C3.62699 8.523 3.59999 8.766 3.59999 9C3.59999 9.234 3.61799 9.477 3.65399 9.702L2.13299 10.89C1.99799 10.998 1.96199 11.196 2.04299 11.349L3.48299 13.842C3.57299 14.004 3.76199 14.058 3.92399 14.004L5.71499 13.284C6.09299 13.572 6.48899 13.806 6.92999 13.986L7.19999 15.894C7.23599 16.074 7.37999 16.2 7.55999 16.2H10.44C10.62 16.2 10.773 16.074 10.791 15.894L11.061 13.986C11.502 13.806 11.907 13.563 12.276 13.284L14.067 14.004C14.229 14.067 14.418 14.004 14.508 13.842L15.948 11.349C16.038 11.187 16.002 10.998 15.858 10.89L14.355 9.702V9.702ZM8.99999 11.7C7.51499 11.7 6.29999 10.485 6.29999 9C6.29999 7.515 7.51499 6.3 8.99999 6.3C10.485 6.3 11.7 7.515 11.7 9C11.7 10.485 10.485 11.7 8.99999 11.7Z"
          />
        </svg>
      </button>
      <span v-else-if="!ext.isApp" class="ext-item__action ext-item__action--placeholder" />
    </div>
  </li>
</template>

<style scoped lang="scss">
.ext-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color ease-out 0.2s;

  &:hover {
    background-color: var(--list-focus-bg);
  }

  &--inactive {
    filter: saturate(0);
  }

  &--development {
    background-color: var(--list-dev-bg);
    --list-focus-bg: var(--list-dev-focus-bg);
  }
}

.ext-item__label {
  display: flex;
  align-items: center;
  flex-grow: 1;
  overflow: hidden;
  padding: 12px 0 12px 16px;
  color: var(--primary);
  cursor: default;
  user-select: none;
}

.ext-item__icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-right: 8px;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.ext-item__name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ext-item__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.ext-item__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin: 0 5px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  opacity: 0.65;
  cursor: pointer;
  transition: opacity ease-out 0.15s;

  &:hover {
    opacity: 1;
  }

  &:focus-visible {
    opacity: 1;
    background-color: var(--list-focus-bg);
    outline: 0;
  }

  svg path {
    fill: var(--list-actions-item-fill);
  }
}

.ext-item__action--delete {
  opacity: 0;
  pointer-events: none;
}

.ext-item:hover .ext-item__action--delete,
.ext-item:focus-within .ext-item__action--delete {
  opacity: 0.65;
  pointer-events: auto;
}

.ext-item__action--delete:hover,
.ext-item__action--delete:focus-visible {
  opacity: 1;
}

.ext-item__action--placeholder {
  cursor: default;
}

.ext-item--app .ext-item__action--placeholder {
  display: none;
}
</style>
