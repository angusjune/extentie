<script setup lang="ts">
import { computed } from 'vue'
import ChevronRight from '~icons/material-symbols/chevron-right-rounded'
import ExtIconButton from '@/components/ExtIconButton.vue'
import ExtCheckbox from '@/components/ExtCheckbox.vue'

const props = withDefaults(defineProps<{
    title?: string,
    description?: string,
    items: chrome.management.ExtensionInfo[],
    collapsed?: boolean,
    showEnableAll?: boolean,
    enabled?: boolean,
}>(), {
    collapsed: false,
    showEnableAll: false,
    enabled: false,
})

const emit = defineEmits<{
    (e: 'update:collapsed', value: typeof props.collapsed): void
    (e: 'update:enabled', value: typeof props.enabled): void
}>()

function toggle() {
    emit('update:collapsed', !props.collapsed)
}

const _enabled = computed({
    get() { return props.enabled },
    set(value) { emit('update:enabled', value) },
})

function focusNext() {
    const items = document.querySelectorAll('[role="listitem"]')
    const focused = document.activeElement as HTMLElement
    const index = Array.from(items).indexOf(focused)
    if (index === -1) {
        (items[0] as HTMLElement)?.focus()
    } else {
        (items[index + 1] as HTMLElement)?.focus()
    }
}

function focusPrev() {
    const items = document.querySelectorAll('[role="listitem"]')
    const focused = document.activeElement as HTMLElement
    const index = Array.from(items).indexOf(focused)
    if (index === -1) {
        (items[items.length - 1] as HTMLElement)?.focus()
    } else {
        (items[index - 1] as HTMLElement)?.focus()
    }
}

</script>

<template>
    <section class="group">
        
        <header class="group__header" @click="toggle">
            <div class="group__leading-action" v-if="showEnableAll">
                <ExtCheckbox v-model="_enabled" />
            </div>
            <h1 class="group__title">{{ title }}</h1>
            <div class="group__action">
                <ExtIconButton class="chevron" :class="{ expanded: !collapsed }">
                    <ChevronRight />
                </ExtIconButton>
            </div>
            <div class="group__description">{{description}}</div>
            
        </header>

        <div class="group__content" v-show="!collapsed" :aria-expanded="collapsed ? 'false' : 'true'" role="list" @keydown.down.prevent="focusNext" @keydown.up.prevent="focusPrev">
            <template v-for="(item, index) in items" :key="item.id">
                <slot name="item" :item="item" :index="index" />
            </template>
        </div>

    </section>
</template>

<style scoped lang="postcss">
.group {

    &__header {
        display: flex;
        align-items: center;
        padding: var(--spacing-2) var(--horizontal-padding);
        cursor: default;
        position: sticky;
        top: 0;
        background: var(--surface);
        z-index: 1;

        &:hover, &:focus-within {
            background-image: linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 100%);

            .chevron {
                opacity: 0.35;
            }
        }
    }

    &__leading-action {
        padding-right: calc(var(--list-spacing-base) * 4);
    }

    &__title {
        font-size: 18px;
        font-weight: 500;
        text-transform: capitalize;
        color: var(--on-surface-primary);
        margin: 0;
    }

    &__description {
        color: var(--on-surface-secondary);
    }

    &__action {
        flex: 1;
        padding: 0 var(--spacing-1);

        .chevron {
            opacity: 0.35;
            transition: 0.12s ease;
            transition-property: opacity, transform;
        }

        .expanded {
            transform: rotate(90deg);
            opacity: 0;
        }
    }
}
</style>