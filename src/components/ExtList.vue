<script>
import ExtCheckbox from '@/components/ExtCheckbox.vue'
import ExtIconButton from '@/components/ExtIconButton.vue'
import Delete from '~icons/material-symbols/delete-rounded'
import Settings from '~icons/material-symbols/settings-rounded'
import OpenInNew from '~icons/material-symbols/open-in-new-rounded'
import Extension from '~icons/material-symbols/extension'

export default({
    components: {
        ExtCheckbox,
        ExtIconButton,
        Delete,
        Settings,
        OpenInNew,
        Extension,
    },
    props: {
        id: String,
        title: String,
        description: String,
        enabled: Boolean,
        mayEnabled: Boolean,
        mayDisabled: Boolean,
        optionsUrl: String,
        isApp: Boolean,
        installType: String,
        icons: Array,
        showActions: {
            type: Boolean,
            default: true,
        },
    },
    emits: ['update:enabled'],
    methods: {
        onDelete() {
            /** @FIXME remove from list after deletion */
            // chrome.management.uninstall(this.id, { showConfirmDialog: true })
            chrome.runtime.sendMessage({ type: 'UNINSTALL', data: { id: this.id } })
        },
        onOpenOptions() {
            chrome.tabs.create({ url: this.optionsUrl })
        },
        onLaunchApp() {
            chrome.management.launchApp(this.id)
        },
    },
    computed: {
        isNormalInstalled() {
            return this.installType === 'normal'
        },
        icon() {
            if (this.icons) {
                return this.icons[this.icons.length - 1].url
            }
            return ''
        }
    },
    watch: {
        enabled(val) {
            this.$emit('update:enabled', val)
        }
    }
})
</script>

<template>
    <div :id="id" class="list" :class="{'list--disabled': !enabled && showActions, 'list--external': !isNormalInstalled}" role="list" :title="description">
        <ExtCheckbox :disabled="enabled ? mayDisabled : mayEnabled" v-model:checked="enabled" v-if="showActions" />
        <label class="list__content">
            <input class="list__native-input" type="checkbox" v-model="enabled" :disabled="!showActions" />
            <div class="list__icon" :style="{backgroundImage: `url(${icon})`}"><Extension v-if="!icon" :style="{fontSize:22, color:'var(--on-surface-tertiary)'}" /></div>
            <div class="list__title-wrap">
                <div class="list__title">{{title}}</div>
            </div>
        </label>
        <div class="list__actions" v-if="showActions">

            <div class="list__actions__button list__actions__button--left show-on-hover">
                <ExtIconButton @click="onDelete">
                    <Delete />
                </ExtIconButton>
            </div>
            
            <div v-if="optionsUrl" class="list__actions__button list__actions__button--right">
                <ExtIconButton @click="onOpenOptions">
                    <Settings />
                </ExtIconButton>
            </div>

            <div v-if="isApp" class="list__actions__button list__actions__button--right">
                <ExtIconButton @click="onLaunchApp">
                    <OpenInNew />
                </ExtIconButton>
            </div>
        </div>
    </div>
</template>

<style scoped lang="postcss">
.list {
    --list-spacing-base: 4px;
    --list-icon-size: 22px;
    --list-font-size: 14px;
    --list-padding: calc(var(--list-spacing-base) * 3) calc(var(--list-spacing-base) * 4);
    --list-grid-gap: calc(var(--list-spacing-base) * 4);

    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-gap: var(--list-grid-gap);
    align-items: center;
    padding: var(--list-padding);

    &:focus, &:hover {
        background: var(--ripple);

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

    &--external {
        --external-bg: #f6edd3;
        @media (prefers-color-scheme: dark) {
            --external-bg: #3E3B30;
        }

        background: var(--external-bg);

        &:focus, &:hover {
            background: #ffe865;
        }
    }

    &__content {
        display: grid;
        grid-template-columns: var(--list-icon-size) 1fr;
        align-items: center;
        grid-gap: 8px;
        font-size: 14px;
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
        width: var(--list-icon-size);
        height: var(--list-icon-size);
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

            &:hover, &:focus {
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