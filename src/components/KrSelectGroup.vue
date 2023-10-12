<script setup lang="ts">

const props = withDefaults(defineProps<{
    title?: string
    subtitle?: string,
    items: { value: string, label?: string, imgSrc?: string, path?: string, color?: string }[],
    modelValue?: string,
    hideSeparator?: boolean,
    distribution?: 'flex-start' | 'flex-end' | 'space-between' | 'space-around',
}>(), {
    modelValue: undefined,
    hideSeparator: false,
    distribution: 'flex-start'
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: typeof props.modelValue): void
}>()

function setSelected(value: typeof props.modelValue) {
    emit('update:modelValue', value)
}
</script>

<template>
    <div class="select-group" :class="{'select-group--with-separator': !hideSeparator}">

        <div class="select-group__header" v-if="title || subtitle">
            <div class="select-group__header__title" v-if="title">{{title}}</div>
            <div class="select-group__header__subtitle" v-if="subtitle">{{subtitle}}</div>
        </div>

        <div class="select-group__items" :style="{justifyContent: distribution}">
            <div v-for="item in items" :key="item.value" @click="setSelected(item.value)">
                <slot name="items" :item="item" :selected="modelValue"></slot>
            </div>
        </div>
        
    </div>
</template>

<style lang="postcss" scoped>
.select-group {

    &--with-separator {
        border-bottom: 1px solid var(--separator);
    }

    &__header {
        box-sizing: border-box;
        padding: 12px 20px 6px;
        display: flex;
        align-items: center;

        &__title {
            font-size: 14px;
            color: var(--on-surface-primary);
        }

        &__subtitle {
            font-size: 12px;
            color: var(--on-surface-secondary);
        }
    }

    &__items {
        padding: 6px 20px 12px;
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: center;
        gap: 8px;
    }
}
</style>