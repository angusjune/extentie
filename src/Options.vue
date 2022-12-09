<script setup lang="ts">
import { reactive, watch, toRaw } from 'vue'
import KrToggleRow from '@/components/KrToggleRow.vue'
import KrLinkRow from '@/components/KrLinkRow.vue'
import KrSelectGroup from '@/components/KrSelectGroup.vue'
import KrSelectItem from '@/components/KrSelectItem.vue'

const i18n = chrome.i18n.getMessage

const layoutOptions =  [
    { value: 'compact', label: i18n('compact'), imgSrc: 'assets/list-compact.svg' },
    { value: 'default', label: i18n('default'), imgSrc: 'assets/list-default.svg' },
    { value: 'comfortable', label: i18n('comfortable'), imgSrc: 'assets/list-comfortable.svg' },
]

const customizeUrl = chrome.runtime.getURL('customize.html')

const options = reactive(<Options>{})
const userGroupSetup: UserGroupInfo[] = reactive([])

chrome.runtime.sendMessage((<Message>{ type: 'GET_ALL' }), (res: {options: Options, userGroups: OptionsUserGroups}) => {
    Object.assign(options, res.options)
    Object.assign(userGroupSetup, res.userGroups.userGroups)
})

watch(options, (val: Options) => {
    chrome.runtime.sendMessage(<Message>{ type: "SET_OPTIONS", data: toRaw(val) })
})
</script>

<template>
    <KrToggleRow :title="i18n('show_search')" v-model="options.enabledSearch" />
    <KrToggleRow :title="i18n('display_full_name')" v-model="options.displayFullName" />
    <KrToggleRow :title="i18n('enabled_ext_on_top')" v-model="options.enabledExtensionsOnTop" />
    <KrToggleRow :title="i18n('show_ext_desc_on_hover')" v-model="options.showExtensionDescriptionOnHover" />

    <KrSelectGroup title="Layout" :items="layoutOptions" v-model="options.layout" distribution="space-between">
        <template #items="{item, selected}">
            <KrSelectItem :value="item.value" :label="item.label" :selected="selected">
                <img :src="item.imgSrc" :alt="item.label" />
            </KrSelectItem>
        </template>
    </KrSelectGroup>

    <KrLinkRow :title="i18n('set_up_user_groups')" :link="customizeUrl" :hide-separator="userGroupSetup.length < 1" />
    <KrToggleRow v-if="userGroupSetup.length > 0" :title="i18n('show_user_groups_only')" v-model="options.showUserGroupsOnly" :hide-separator="true" />
</template>

<style lang="postcss" scoped>
.container {
    min-width: 320px;
}
</style>