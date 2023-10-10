<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import KrToggleRow from '@/components/KrToggleRow.vue'
import KrLinkRow from '@/components/KrLinkRow.vue'
import KrSelectGroup from '@/components/KrSelectGroup.vue'
import KrSelectItem from '@/components/KrSelectItem.vue'
import KrSection from '@/components/KrSection.vue'
import { iconPaths, iconColors } from './action-icon'
import { msg } from '@/utils/i18n'

const layoutOptions =  [
    { value: 'compact', label: msg('compact'), imgSrc: 'assets/list-compact.svg' },
    { value: 'default', label: msg('default'), imgSrc: 'assets/list-default.svg' },
    { value: 'comfortable', label: msg('comfortable'), imgSrc: 'assets/list-comfortable.svg' },
]

const iconStyleOptions =  [
    { value: 'classic', label: msg('classic'), path: iconPaths.CLASSIC },
    { value: 'geometric', label: msg('geometric'), path: iconPaths.GEOMETRIC },
    { value: 'modern', label: msg('modern'), path: iconPaths.MODERN},
]

const iconColorOptions = [
    { value: 'auto', label: msg('options_theme_auto'), color: 'linear-gradient(135deg, #fff 0%, #fff 50%, #444 50.1%, #444 100%)' },
    { value: 'light', label: msg('options_theme_light'), color: iconColors.LIGHT },
    { value: 'dark', label: msg('options_theme_dark'), color: iconColors.DARK },
    { value: 'blue', label: msg('options_theme_blue'), color: iconColors.BLUE },
    { value: 'yellow', label: msg('options_theme_yellow'), color: iconColors.YELLOW },
]

const selectedIconColorHex = computed(() => {
    if (options.value.iconColor === 'auto') return 'var(--auto-icon-color)'
    return iconColorOptions.find((item) => item.value === options.value.iconColor)?.color
})

const customizeUrl = chrome.runtime.getURL('customize.html')

const options        = ref<ExtentieOptions>({} as ExtentieOptions)
const userGroupSetup = ref<UserGroupInfo[]>([])

onMounted(() => {
    chrome.runtime.sendMessage({type: 'GET_ALL'}, (res: {options: ExtentieOptions, userGroups: OptionsUserGroups}) => {
        options.value = res.options
        userGroupSetup.value = res.userGroups.userGroups
    })
})

watch(options, (val: ExtentieOptions) => {
    chrome.runtime.sendMessage(<Message>{ type: "SET_OPTIONS", data: val })
}, { deep: true })

</script>

<template>
    <div class="container">
        <KrSection :title="msg('general')">
            <KrToggleRow :title="msg('show_search')" v-model="options.enabledSearch" />
            <KrToggleRow :title="msg('display_full_name')" v-model="options.displayFullName" />
            <KrToggleRow :title="msg('enabled_ext_on_top')" v-model="options.enabledExtensionsOnTop" />
            <KrToggleRow :title="msg('show_ext_desc_on_hover')" v-model="options.showExtensionDescriptionOnHover" />
            <KrToggleRow :title="msg('hightlight_side_load')" v-model="options.highlightSideLoadExtensions" hide-separator />
        </KrSection>

        <KrSection :title="msg('appearance')">

            <KrSelectGroup :title="msg('layout')" :items="layoutOptions" v-model="options.layout" distribution="space-between">
                <template #items="{item, selected}">
                    <KrSelectItem :value="item.value" :label="item.label" :selected="selected">
                        <img :src="item.imgSrc" :alt="item.label" />
                    </KrSelectItem>
                </template>
            </KrSelectGroup>

            <KrSelectGroup :title="msg('icon_style')" :items="iconStyleOptions" v-model="options.iconStyle">
                <template #items="{item, selected}">
                    <KrSelectItem :value="item.value" :label="item.label" :selected="selected">
                        <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path :d="item.path" :fill="selectedIconColorHex" style="transform:scale(0.8); transform-origin:center;"/>
                        </svg>
                    </KrSelectItem>
                </template>
            </KrSelectGroup>

            <KrSelectGroup :title="msg('icon_color')" :items="iconColorOptions" v-model="options.iconColor">
                <template #items="{item, selected}">
                    <KrSelectItem :value="item.value" :label="item.label" :selected="selected" circle>
                        <div class="color-option" :style="{background: item.color}"></div>
                    </KrSelectItem>
                </template>
            </KrSelectGroup>

            <KrToggleRow :title="msg('use_native_scroll_bar')" v-model="options.useNativeScrollbar" hide-separator />

        </KrSection>

        <KrSection :title="msg('groups')">
            <KrLinkRow :title="msg('set_up_user_groups')" :link="customizeUrl" :hide-separator="userGroupSetup.length < 1" />
            <KrToggleRow v-if="userGroupSetup.length > 0" :title="msg('show_user_groups_only')" v-model="options.showUserGroupsOnly" hide-separator />
        </KrSection>
    </div>
</template>

<style lang="postcss" scoped>
.container {
    --auto-icon-color: #444;
    @media (prefers-color-scheme: dark) {
        --auto-icon-color: #fff;
    }
}
.color-option {
    width: 24px;
    height: 24px;
    border-radius: 50%;
}
</style>