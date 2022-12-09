<script setup lang="ts">
const props = defineProps<{
    title?: string,
}>()
</script>

<template>
    <div class="empty">
        <div class="empty__icon">
            <svg viewBox="0 0 102 76" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M65.5272 4.62856C61.568 4.69755 58.0921 8.90085 56.8437 13.6201C54.7368 21.5842 68.1202 19.5056 70.56 29.647C73.6098 42.3237 94.3616 35.9507 97.7487 27.4051C101.136 18.8595 91.834 12.6567 81.9606 14.2432C72.0873 15.8297 70.4762 4.54232 65.5272 4.62856Z" stroke="var(--on-surface-tertiary)" stroke-width="2" stroke-dasharray="4 4"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M50 16C46.4735 16 43.5561 18.6077 43.0709 22H34C30.6863 22 28 24.6863 28 28V37C31.866 37 35 40.134 35 44C35 47.866 31.866 51 28 51V60C28 63.3137 30.6863 66 34 66H43C43 62.134 46.134 59 50 59C53.866 59 57 62.134 57 66H66C69.3137 66 72 63.3137 72 60V50.9291C75.3923 50.4439 78 47.5265 78 44C78 40.4735 75.3923 37.5561 72 37.0709V28C72 24.6863 69.3137 22 66 22H56.9291C56.4439 18.6077 53.5265 16 50 16Z" fill="var(--theme)"/>
                <path d="M0 47L3.33333 33L16 42.3333L0 47Z" fill="var(--on-surface-tertiary)"/>
                <circle cx="96" cy="57" r="4" fill="var(--on-surface-tertiary)"/>
            </svg>
        </div>
        <h1 class="empty__title">{{title}}</h1>

        <div class="empty__content">
            <slot />
        </div>
    </div>
</template>

<style lang="postcss" scoped>
.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 32px 42px;
    text-align: center;

    &__icon {
        margin-bottom: 16px;
        width: 100px;
    }

    &__title {
        font-size: 16px;
        font-weight: 600;
        color: var(--on-surface-primary);
        margin: 0;
    }

    &__content {
        font-size: 12px;
        color: var(--on-surface-secondary);
        margin-top: 8px;
    }
}
</style>