<script lang="ts" setup>
import { ref, watch } from 'vue'

const props = defineProps<{
    open: boolean,
    title?: string,
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()

const dialog = ref<HTMLDialogElement>()

watch(() => props.open, isOpen => {
    if (isOpen) {
        // Modal dialogs live in the top layer, so a clipping ancestor cannot hide them.
        if (!dialog.value?.open) dialog.value?.showModal()
    } else {
        dialog.value?.close()
    }
})

// The backdrop is part of the dialog element itself, so a click on it lands here.
function onClick(event: MouseEvent) {
    if (event.target === dialog.value) emit('close')
}
</script>

<template>
    <dialog ref="dialog" class="dialog" :aria-label="title" @close="$emit('close')" @click="onClick">
        <div class="dialog__content">
            <h1 class="dialog__title" v-if="title">{{title}}</h1>
            <slot />
            <div class="dialog__actions">
                <slot name="actions" />
            </div>
        </div>
    </dialog>
</template>

<style lang="postcss" scoped>
.dialog {
    box-sizing: border-box;
    width: min(360px, calc(100vw - 32px));
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: var(--surface);
    color: var(--on-surface-primary);
    box-shadow: 0 2px 12px rgba(0,0,0,.3);

    &::backdrop {
        background: rgba(0,0,0,.4);
    }

    &__content {
        padding: 20px;
    }

    &__title {
        font-size: 15px;
        font-weight: 500;
        color: var(--on-surface-primary);
        margin: 0 0 8px;
    }

    &__actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 8px;
        padding-top: 20px;
    }
}
</style>
