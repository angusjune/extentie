<script setup lang="ts">
const props = withDefaults(defineProps<{
    modelValue: number,
    tabs: string[],
}>(), {
    modelValue: 0,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: typeof props.modelValue): void
}>()

function selectTab(index: number) {
    emit('update:modelValue', index)
}
</script>

<template>
    <div class="tab-bar">
        <div
            v-for="(tab, index) in tabs"
            :key="index"
            class="tab-bar__tab"
            :class="{ active: index === modelValue }"
            @click="selectTab(index)"
        >
            {{ tab }}

            <div v-if="index == 0" class="active-indicator" :style="{'--selected': modelValue}">
                <div class="active-indicator__inner"></div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="postcss">
.tab-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    border-top: 1px solid var(--separator);

    &__tab {
        font-size: 12px;
        position: relative;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 12px 12px 14px;
        cursor: pointer;
        color: var(--on-surface-tertiary);

        &.active {
            color: var(--on-surface-primary);
        }
    }

    .active-indicator {
        position: absolute;
        top: 0;
        width: 100%;
        height: 3px;
        transform: translateX(calc(var(--selected, 0) * 100%));
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        opacity: 0.4;

        &__inner {
            height: 100%;
            width: 100%;
            max-width: 60px;
            border-radius: 99px;
            background: var(--theme);
            margin: auto;
        }
    }
}
</style>