<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    label?: string
    value?: string | number,
    selected?: string | number,
    circle?: boolean
}>(), {
    circle: false
})

const emit = defineEmits<{
    (e: 'update:selected', value: typeof props.selected): void
}>()

const modelValue_ = computed({
    get() {
        return props.selected
    },
    set(value: typeof props.selected) {
        emit('update:selected', value)
    }
})
</script>

<template>
    <label class="select-item" :class="{'select-item--checked': modelValue_ === value}">
        <input class="select-item__input" type="radio" :value="value" v-model="modelValue_" />
        <span class="select-item__content"><slot /></span>
        <span class="select-item__label" v-if="label">{{label}}</span>
    </label>
</template>

<style lang="postcss" scoped>
.select-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    &__content {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        border: 1px solid var(--separator);
        transition: box-shadow 0.1s ease-out, background 0.1s ease-out;
        will-change: box-shadow, background;

        .select-item--checked & {
            box-shadow: 0 0 0 2px var(--theme);
            background: var(--ripple);
        }
    }

    &__label {
        display: flex;
        font-size: 12px;
        color: var(--on-surface-secondary);
        padding-top: 4px;
        text-align: center;

        .select-item--checked & {
            color: var(--theme);
        }
    }

    &__input {
        display: none;
    }
}
</style>