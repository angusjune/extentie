<script setup lang="ts">
import ChevronRight from '~icons/material-symbols/chevron-right-rounded'
import ExtIconButton from '@/components/ExtIconButton.vue'

const props = withDefaults(defineProps<{
    title?: string,
    description?: string,
    items: DefaultExtensionGroups[],
    collapsed?: boolean,
}>(), {
    collapsed: false,
})

const emit = defineEmits<{
    (e: 'update:collapsed', value: typeof props.collapsed): void
}>()

function toggle() {
    emit('update:collapsed', !props.collapsed)
}

</script>

<template>
    <section class="group">
        
        <header class="group__header" @click="toggle">
            <h1 class="group__title">{{ title }}</h1>
            <div class="group__action">
                <ExtIconButton class="chevron" :class="{ expanded: !collapsed }">
                    <ChevronRight />
                </ExtIconButton>
            </div>
            <div class="group__description">{{description}}</div>
            
        </header>

        <div class="group__content" v-show="!collapsed">
            <template v-for="(item, index) in items" :key="item.id">
                <slot name="item" :item="item" :index="index" />
            </template>
        </div>

    </section>
</template>

<style scoped lang="postcss">
.group {

    &__header {
        display: grid;
        grid-template-columns: auto 1fr auto;
        grid-template-areas: "title action description";
        grid-gap: 4px;
        align-items: center;
        padding: 8px var(--horizontal-padding);
        cursor: default;

        &:hover {
            background: linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 100%);

            .chevron {
                opacity: 0.35;
            }
        }
    }

    &__title {
        grid-area: title;
        font-size: 18px;
        font-weight: 500;
        text-transform: capitalize;
        color: var(--on-surface-primary);
        margin: 0;
    }

    &__description {
        grid-area: description;
    }

    &__action {
        grid-area: action;

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