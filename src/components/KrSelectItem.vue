<script lang="ts" setup>
import { computed } from 'vue'


const props = withDefaults(defineProps<{
    value: string,
    selected?: string,
    title?: string,
    label?: string,
    circle?: boolean,
}>(), {
    circle: false,
})

const emit = defineEmits<{
  (e: 'update:selected', value: typeof props.selected): void
}>()

const modelValue_ = computed({
    get() { return props.selected },
    set(value) { emit('update:selected', value) },
})
</script>

<template>
    <label class="select-item" :class="{'select-item--selected': selected === value, 'select-item--circle': circle}">
        <input class="select-item__input" type="radio" :value="value" v-model="modelValue_" />
        <div class="select-item__content"><slot /></div>
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
    }

    &__label {
        display: flex;
        font-size: 12px;
        color: var(--on-surface-secondary);
        padding-top: 4px;
        text-align: center;
    }

    &__input {
        display: none;
    }

    &--circle {
        .select-item__content {
            border-radius: 50%;
        }
    }

    &--selected {
        .select-item__content {
            box-shadow: 0 0 0 2px var(--theme);
            background: var(--ripple);
        }

        .select-item__label {
            font-weight: 500;
            color: var(--theme);
        }
    }
}
</style>