<script lang="ts" setup>
import Search from '~icons/material-symbols/search-rounded'
import Close from '~icons/material-symbols/close-rounded'
import ExtIconButton from '@/components/ExtIconButton.vue'
import { computed } from 'vue';

const props = defineProps<{
    value?: string,
}>()

const emit = defineEmits<{
  (e: 'update:value', value: typeof props.value): void
}>()

const value_ = computed({
    get() { return props.value },
    set(value) { emit('update:value', value) },
})

const vFocus = {
    mounted: (el: HTMLInputElement) => el.focus()
}
</script>

<template>
    <div class="text-field">
        <div class="text-field__icon">
            <slot name="icon">
                <Search />
            </slot>
        </div>

        <input class="text-field__input" type="text" v-model="value_" aria-label="search" ref="input" v-focus />

        <div class="text-field__icon" v-if="value_">
            <ExtIconButton  @click="value_=''">
                <Close />
            </ExtIconButton>
        </div>
    </div>
</template>

<style scoped>
.text-field {
    display: grid;
    grid-template-columns: 32px 1fr 32px;
    background: var(--form-field);
    border-radius: 999px;

    &:focus-within {
        .text-field__icon {
            opacity: 0.8;
        }
    }

    &__input {
        background: transparent;
        border: 0;
        color: var(--on-surface-primary);

        &:focus {
            outline: none;
        }
    }

    &__icon {
        padding: 6px 8px;
        font-size: 18px;
        opacity: 0.5;
        transition: opacity 0.15s ease;
        color: var(--on-surface-secondary);
    }
}
</style>