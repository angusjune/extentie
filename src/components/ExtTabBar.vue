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

// switch to the next tab
function focusNext() {
    const next = props.modelValue + 1
    if (next < props.tabs.length) {
        emit('update:modelValue', next)
    } else {
        emit('update:modelValue', 0)
    }
}

// switch to the previous tab
function focusPrev() {
    const prev = props.modelValue - 1
    if (prev >= 0) {
        emit('update:modelValue', prev)
    } else {
        emit('update:modelValue', props.tabs.length - 1)
    }
}
</script>

<template>
    <div class="tab-bar" role="tablist" @keydown.left.prevent="focusNext" @keydown.right.prevent="focusPrev">
        <button
            v-for="(tab, index) in tabs"
            :key="index"
            class="tab-bar__tab"
            :class="{ active: index === modelValue }"
            @click="selectTab(index)"
            role="tab"
            :tabindex="index === modelValue ? '0' : '-1'"
            :aria-selected="index === modelValue ? 'true' : 'false'"
            :aria-controls="`panel-${index}`"
        >
            {{ tab }}

            <div v-if="index == 0" class="active-indicator" :style="{'--selected': modelValue}" aria-hidden="true">
                <div class="active-indicator__inner"></div>
            </div>
        </button>
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
        transition: color 0.12s ease-out;
        touch-action: manipulation;
        background: none;
        border: 0;

        &.active {
            color: var(--on-surface-primary);
        }

        &:focus-visible {
            outline: 0;
        }
    }

    .active-indicator {
        position: absolute;
        top: 0;
        width: 100%;
        height: 3px;
        transform: translateX(calc(var(--selected, 0) * 100%));
        transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
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