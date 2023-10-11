<script lang="ts" setup>
import { computed } from 'vue'
const props = defineProps<{
    modelValue?: boolean,
    disabled?: boolean,
}>()

const checked = computed({
    get() { return props.modelValue },
    set(value) { emit('update:modelValue', value) },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: typeof props.modelValue): void
}>()
</script>

<template>
    <label class="checkbox" role="button">
        <input class="checkbox__input" type="checkbox" v-model="checked" :disabled="disabled" />
        <span class="checkbox__indicator" aria-hidden="true">
            <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 9L8 12L13 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
    </label>
</template>

<style scoped lang="postcss">
.checkbox {
    --checkbox-size: 18px;
    --checkbox-stroke-color: var(--on-surface-secondary);
    --checkbox-checkmark-stroke-color: var(--on-theme-primary);
    --checkbox-checked-container: var(--theme);

    &__input {
        display: none;

        &:checked ~ .checkbox__indicator {
            background: var(--checkbox-checked-container);
            box-shadow: inset 0 0 0 2px var(--checkbox-checked-container);

            path {
                stroke-dashoffset: 0;
            }
        }

        &:disabled ~ .checkbox__indicator {
            opacity: .38;
        }

        &:focus ~ .checkbox__indicator:before {
            transform: scale(1);
        }

    }

    &__indicator {
        color: var(--checkbox-stroke-color, #fff);
        box-sizing: border-box;
        display: inline-grid;
        place-items: center;
        position: relative;
        width: var(--checkbox-size);
        height: var(--checkbox-size);
        border-radius: 50%;
        box-shadow: inset 0 0 0 2px var(--checkbox-stroke-color);
        transition: background 0.1s linear;

        &:before {
            content: '';
            position: absolute;
            width: calc(var(--checkbox-size) * 2);
            height: calc(var(--checkbox-size) * 2);
            border-radius: 50%;
            background: var(--ripple, rgba(26,115,232,0.3));
            left: calc(var(--checkbox-size) / -2);
            top: calc(var(--checkbox-size) / -2);
            transition: transform 0.12s ease-out;
            transform: scale(0);
        }

        path {
            stroke: var(--checkbox-checkmark-stroke-color);
            opacity: 0.95;
            stroke-dasharray: 12;
            stroke-dashoffset: 12;
            transition: stroke-dashoffset cubic-bezier(0.33, 1, 0.68, 1) 0.3s;
        }
    }
}
</style>