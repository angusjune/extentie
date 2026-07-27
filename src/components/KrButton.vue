<script lang="ts" setup>
withDefaults(defineProps<{
    variant?: 'primary' | 'secondary' | 'plain',
    disabled?: boolean,
}>(), {
    variant: 'secondary',
    disabled: false,
})
</script>

<template>
    <button class="button" :class="`button--${variant}`" :disabled="disabled">
        <slot />
    </button>
</template>

<style lang="postcss" scoped>
.button {
    --button-hover-background: rgba(26,115,232,.08);

    box-sizing: border-box;
    height: 32px;
    padding: 0 12px;
    border-radius: 4px;
    border: 1px solid transparent;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    background: transparent;
    color: var(--theme);

    @media (prefers-color-scheme: dark) {
        --button-hover-background: rgba(138,180,248,.12);
    }

    &:hover:not(:disabled), &:focus-visible:not(:disabled) {
        background: var(--button-hover-background);
    }

    &:disabled {
        color: var(--on-surface-tertiary);
    }

    &--primary {
        background: var(--theme);
        color: var(--on-theme-primary);

        &:hover:not(:disabled), &:focus-visible:not(:disabled) {
            background: var(--theme);
            opacity: .9;
        }

        &:disabled {
            background: var(--form-field);
            color: var(--on-surface-tertiary);
        }
    }

    &--secondary {
        border-color: var(--on-surface-tertiary);
    }
}
</style>
