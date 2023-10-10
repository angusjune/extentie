<script lang="ts" setup>
import OpenInNew from '~icons/material-symbols/open-in-new-rounded'

const props = defineProps<{
    title?: string,
    subtitle?: string,
    link?: string,
    hideSeparator?: boolean,
}>()

function onClick() {
    chrome.tabs.create({url: props.link})
}
</script>

<template>
    <div class="link-row" :class="{'link-row--with-separator': !hideSeparator}" @click="onClick">
        <label class="link-row__label">
            <div class="link-row__title" v-if="title">{{title}}</div>
            <div class="link-row__subtitle" v-if="subtitle">{{subtitle}}</div>
        </label>
        <div class="link-row__icon" role="link">
            <OpenInNew />
        </div>
    </div>
</template>

<style lang="postcss" scoped>
.link-row {
    --list-hover-background: rgba(0,0,0,.05);

    box-sizing: border-box;
    padding: 12px 20px;
    display: flex;
    align-items: center;

    @media (prefers-color-scheme: dark) {
        --list-hover-background: rgba(255,255,255,.07);
    }

    &:hover, &:focus {
        background: var(--list-hover-background);
    }

    &--with-separator {
        border-bottom: 1px solid var(--separator);
    }

    &__label {
        flex: 1;
        cursor: pointer;
    }

    &__title {
        font-size: 14px;
        color: var(--on-surface-primary);
    }

    &__subtitle {
        font-size: 12px;
        color: var(--on-surface-secondary);
    }

    &__icon {
        display: grid;
        place-items: center;
        font-size: 20px;
        color: var(--on-surface-secondary);
    }
}
</style>