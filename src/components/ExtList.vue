<script lang="ts" setup>
import { computed } from 'vue'
import ExtCheckbox from '@/components/ExtCheckbox.vue'
import ExtIconButton from '@/components/ExtIconButton.vue'
import Delete from '~icons/material-symbols/delete-rounded'
import Settings from '~icons/material-symbols/settings-rounded'
import OpenInNew from '~icons/material-symbols/open-in-new-rounded'
import Extension from '~icons/material-symbols/extension'
import { msg } from '@/utils/i18n'

const props = withDefaults(defineProps<{
    id: string,
    title: string,
    description?: string,
    enabled: boolean,
    mayEnable?: boolean,
    mayDisable: boolean,
    disabledReason?: string,
    optionsUrl: string,
    isApp: boolean,
    icons?: chrome.management.IconInfo[],
    highlight?: boolean,
    showActions?: boolean,
}>(), {
    showActions: true,
    highlight: false,
    mayEnable: true,
})

const emit = defineEmits<{
  (e: 'update:enabled', value: typeof props.enabled): void
}>()

function onDelete() {
    chrome.runtime.sendMessage({ type: 'UNINSTALL', data: { id: props.id } })
}
function onOpenOptions() {
    chrome.tabs.create({ url: props.optionsUrl })
}
function onLaunchApp() {
    chrome.management.launchApp(props.id)
}

const icon = computed(() => {
    if (props.icons) {
        return props.icons[props.icons.length - 1].url
    }
    return ''
})

const _enabled = computed({
    get() { return props.enabled },
    set(value) { emit('update:enabled', value) },
})

// Chrome has to run its own confirmation for these, so the toggle opens its
// extensions page rather than enabling the extension here.
const needsPermissionReview = computed(() => !props.enabled && props.disabledReason === 'permissions_increase')

const tooltip = computed(() => needsPermissionReview.value ? msg('needs_permission_review') : props.description)
</script>

<template>
    <div 
        :id="id" 
        class="list" 
        :class="{'list--disabled': !_enabled && showActions, 'list--highlight': highlight}" 
        role="listitem" 
        tabindex="0"
        :title="tooltip"
        @keydown.enter="_enabled = !_enabled"
        @keydown.delete="onDelete"
    >
        <ExtCheckbox :disabled="_enabled ? !mayDisable : !mayEnable" v-model="_enabled" v-if="showActions" :aria-labelledby="`label-${id}`" />
        <label class="list__content" :id="`label-${id}`">
            <input class="list__native-input" type="checkbox" v-model="_enabled" :disabled="!showActions" />
            <div class="list__icon" :style="{backgroundImage: `url(${icon})`}" aria-hidden="true"><Extension v-if="!icon" :style="{fontSize:22, color:'var(--on-surface-tertiary)'}" /></div>
            <div class="list__title-wrap">
                <div class="list__title">{{title}}</div>
            </div>
        </label>
        <div class="list__actions" v-if="showActions">

            <div class="list__actions__button list__actions__button--left show-on-hover">
                <ExtIconButton @click="onDelete" :aria-label="msg('delete_this')">
                    <Delete />
                </ExtIconButton>
            </div>
            
            <div v-if="optionsUrl" class="list__actions__button list__actions__button--right">
                <ExtIconButton @click="onOpenOptions" :aria-label="msg('open_option')">
                    <Settings />
                </ExtIconButton>
            </div>

            <div v-if="isApp" class="list__actions__button list__actions__button--right">
                <ExtIconButton @click="onLaunchApp" :aria-label="msg('launch_app')">
                    <OpenInNew />
                </ExtIconButton>
            </div>
        </div>
    </div>
</template>

<style scoped lang="postcss">
.list {
    --list-padding: calc(var(--list-spacing-base, 4px) * 3) calc(var(--list-spacing-base, 4px) * 4);
    --list-grid-gap: calc(var(--list-spacing-base, 4px) * 4);

    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-gap: var(--list-grid-gap);
    align-items: center;
    padding: var(--list-padding);
    transition: background 0.1s ease;

    &:focus, &:hover, &:focus-within {
        background: var(--ripple);
        outline: 0;

        .show-on-hover {
            display: block;
        }
    }

    &--disabled {
        .list__icon {
            filter: grayscale(100%);
        }

        .list__content {
            opacity: 0.5;
        }
    }

    &--highlight {
        --highlight-bg: #f6edd3;
        --highlight-bg-hover: #ffe865;
        @media (prefers-color-scheme: dark) {
            --highlight-bg: #3E3B30;
            --highlight-bg-hover: #4E4B40;
        }

        background: var(--highlight-bg);

        &:focus, &:hover {
            background: var(--highlight-bg-hover);
        }
    }

    &__content {
        display: grid;
        grid-template-columns: var(--list-icon-size, 22px) 1fr;
        align-items: center;
        grid-gap: 8px;
        font-size: var(--list-font-size, 14px);
        color: var(--on-surface-primary);
        cursor: default;
        transition: opacity 0.12s ease;
    }

    &__title-wrap {
        overflow: hidden;
        position: relative;
    }

    &__title {
        white-space: nowrap;
    }

    &__icon {
        width: var(--list-icon-size, 22px);
        height: var(--list-icon-size, 22px);
        background-size: contain;
        transition: filter 0.12s ease;
    }

    &__native-input {
        display: none;
    }

    &__actions {
        display: grid;
        grid-template-columns: repeat(2, 18px);
        grid-template-areas: 'left right';
        grid-gap: 8px;
        font-size: 24px;

        &__button {
            opacity: 0.4;
            transition: opacity ease-in-out 0.2s;

            &:hover, &:focus, &:focus-within {
                opacity: 0.8;
            }

            &--left {
                grid-area: left;
            }

            &--right {
                grid-area: right;
            }
        }
    }

    .show-on-hover {
        display: none;
    }
}
</style>