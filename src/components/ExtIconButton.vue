<script lang="ts" setup>
const props = defineProps<{
    ariaLabel?: string,
    disabled?: boolean,
}>()
</script>

<template>
    <button class="icon-button" :aria-label="ariaLabel" :disabled="disabled">
        <slot />
    </button>
</template>

<style lang="postcss" scoped>
.icon-button {
    --button-size: 18px;

    display: grid;
    place-items: center;
    width: var(--button-size);
    height: var(--button-size);
    border: 0;
    margin: 0;
    padding: 0;
    background: transparent;
    position: relative;
    font-size: var(--button-size);
    color: var(--on-surface-primary);

    &:focus:before {
        transform: scale(1);
    }

    &:before {
        content: '';
        position: absolute;
        width: calc(var(--button-size) * 2);
        height: calc(var(--button-size) * 2);
        border-radius: 50%;
        background: var(--ripple, rgba(26,115,232,0.3));
        left: calc(var(--button-size) / -2);
        top: calc(var(--button-size) / -2);
        transition: transform 0.12s ease-out;
        transform: scale(0);
    }

}
</style>