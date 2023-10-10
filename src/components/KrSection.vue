<script lang="ts" setup>
const props = defineProps<{
    title?: string,
    subtitle?: string,
}>()
</script>

<template>
    <section class="section">
        <header v-if="title || subtitle" class="section__header">
            <h1 class="section__title" v-if="title">{{title}}</h1>
            <h2 class="section__subtitle" v-if="subtitle">{{subtitle}}</h2>
        </header>
        <div class="section__content">
            <slot />
        </div>
    </section>
</template>

<style lang="postcss" scoped>
.section {
    padding: var(--spacing-3);

    &__header {
        padding-bottom: var(--spacing-2);
    }

    &__title {
        font-size: 14px;
        font-weight: 600;
        color: var(--on-surface-primary);
        margin: 0;
        text-transform: capitalize;
    }

    &__subtitle {
        font-size: 12px;
        font-weight: normal;
        color: var(--on-surface-secondary);
        margin: 0;
    }

    &__content {
        background: var(--surface);
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--separator);
    }
}
</style>