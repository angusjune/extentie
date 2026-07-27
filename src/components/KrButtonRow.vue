<script lang="ts" setup>
import KrButton from '@/components/KrButton.vue'

withDefaults(defineProps<{
    title?: string,
    subtitle?: string,
    label: string,
    disabled?: boolean,
    hideSeparator?: boolean,
}>(), {
    disabled: false,
    hideSeparator: false,
})

defineEmits<{
    (e: 'click'): void
}>()
</script>

<template>
    <div class="button-row" :class="{'button-row--with-separator': !hideSeparator}">
        <div class="button-row__label">
            <div class="button-row__title" v-if="title">{{title}}</div>
            <div class="button-row__subtitle" v-if="subtitle">{{subtitle}}</div>
        </div>
        <KrButton :disabled="disabled" @click="$emit('click')">{{label}}</KrButton>
    </div>
</template>

<style lang="postcss" scoped>
.button-row {
    box-sizing: border-box;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 12px;

    &--with-separator {
        border-bottom: 1px solid var(--separator);
    }

    &__label {
        flex: 1;
    }

    &__title {
        font-size: 14px;
        color: var(--on-surface-primary);
    }

    &__subtitle {
        font-size: 12px;
        color: var(--on-surface-secondary);
    }
}
</style>
