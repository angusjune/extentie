<script setup lang="ts">
import { watch, ref, reactive, computed, toRaw } from 'vue'
import { ExtensionGroup } from './ExtensionGroup'
import ExtInput from '@/components/ExtTextField.vue'
import ExtList from '@/components/ExtList.vue'
import ExtGroup from '@/components/ExtGroup.vue'
import ExtTabBar from '@/components/ExtTabBar.vue'
import ExtEmpty from '@/components/ExtEmpty.vue'
import { msg } from '@/utils/i18n'

interface groupTitleMap {
    [key: chrome.management.ExtensionInfo['type']]: string
}

const groupTitles: groupTitleMap = {
    'extension': msg('extensions'),
    'login_screen_extension': msg('extensions'),
    'packaged_app': msg('applications'),
    'legacy_packaged_app': msg('applications'),
    'hosted_app': msg('applications'),
    'theme': msg('themes'),
}

const extensions: chrome.management.ExtensionInfo[] = reactive([])
const options = reactive(<ExtentieOptions>{})
const userGroupSetup: UserGroupInfo[] = reactive([])

const defaultExtensionGroups = reactive(<DefaultExtensionGroups>{}) // extension groups grouped by type
const userExtensionGroups = reactive(<DefaultExtensionGroups>{})

const currentTab = ref(0)
const collapsed: chrome.management.ExtensionInfo['id'][] = reactive([])
const searchTerm = ref<string>('')

const tabItems = [msg('all'), msg('groups')]

const hasInit = ref(false)

chrome.runtime.sendMessage(<Message>{ type: "GET_ALL" }, (res: {extensions: chrome.management.ExtensionInfo[], options: ExtentieOptions, userGroups: OptionsUserGroups}) => {
    console.log(res)
    Object.assign(extensions, res.extensions)
    Object.assign(userGroupSetup, res.userGroups.userGroups)
    Object.assign(options, res.options)

    Object.assign(defaultExtensionGroups, getDefaultGroups())
    Object.assign(userExtensionGroups, getUserGroups())

    collapsed.push(...JSON.parse(res.options.collapsed))
    currentTab.value = res.options.selectedTab

    document.documentElement.style.height = res.options.popupHeight + 'px'

    hasInit.value = true
})

const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
chrome.runtime.sendMessage({ type: "SET_COLOR_SCHEME", data: { colorScheme: isDarkMode ? 'dark' : 'light' } })

chrome.runtime.onMessage.addListener(({ type, data }: Message, sender, sendResponse) => {
    if (type === 'EXT_CHANGED') {
        Object.assign(extensions, data)
        Object.assign(defaultExtensionGroups, getDefaultGroups())
        Object.assign(userExtensionGroups, getUserGroups())
    }
})

function setEnabled(id: chrome.management.ExtensionInfo['id'], enabled: boolean) {
    // The toggle has already flipped, so follow the state the background reports
    // back: a refused or failed change puts it right again.
    chrome.runtime.sendMessage({ type: "SET_ENABLED", data: { id, enabled } }).then((res: {id: string, enabled: boolean}) => {
        const extension = extensions.find(ext => ext.id === id)
        if (extension) extension.enabled = res.enabled
    })
}

function setGroupEnabled(id: string, enabled: boolean) {
    const group = userGroupSetup.find(group => group.id === id)
    if (!group) return

    for (const ext of group.order) {
        setEnabled(ext, enabled)
    }
}

function getDefaultGroups() {
    //group extensions by type
    let groups = <DefaultExtensionGroups>{}

    for (const ext of extensions) {

        const type = groupTitles[ext.type] || ext.type

        if (!groups[type]) {
            groups[type] = new ExtensionGroup(type, type)
        }
        groups[type].addToExtensions(ext)
    }

    //sort extensions by name
    for (const type in groups) {
        if (!groups[type].extensions) return

        groups[type].extensions.sort((a, b) => {
            return a.name.localeCompare(b.name)
        })
    }

    // sort extensions by enabled
    if (options.enabledExtensionsOnTop) {
        for (const type in groups) {
            groups[type].extensions.sort((a, b) => {
                if (a.enabled && !b.enabled) return -1
                if (!a.enabled && b.enabled) return 1
                return 0
            })
        }
    }
    return groups
}

function getUserGroups() {
    let groups = <DefaultExtensionGroups>{}

    for (const {id, name, order} of userGroupSetup) {
        if (!groups[id]) {
            groups[id] = new ExtensionGroup(id, name)
        }

        groups[id].name = name || ''
        /** @ts-ignore */
        groups[id].extensions = order.filter(extId => extensions.findIndex(ext => ext.id === extId) > -1).map(extId => extensions.find(ext => ext.id === extId))
    }

    return groups
}

function groupToggleCollapsed(id: string) {
    if (collapsed.includes(id)) {
        collapsed.splice(collapsed.indexOf(id), 1)
    } else {
        collapsed.push(id)
    }
    chrome.runtime.sendMessage({ type: "SET_OPTIONS", data: { collapsed: JSON.stringify(toRaw(collapsed)) } })
}

function getSearchResults(searchTerm: string, searchIn: DefaultExtensionGroups): DefaultExtensionGroups {
    let found = <DefaultExtensionGroups>{}
    for (const [id, {extensions, name}] of Object.entries(searchIn)) {
        const filtered = extensions.filter(ext => ext?.name.toLowerCase().includes(searchTerm.toLowerCase()))
        if (filtered.length > 0) {
            filtered.sort((a, b) => {
                // if a starts with searchTerm, it should be first
                if (a.name.toLowerCase().startsWith(searchTerm.toLowerCase())) return -1
                if (b.name.toLowerCase().startsWith(searchTerm.toLowerCase())) return 1
                return 0
            })
            found[id] = new ExtensionGroup(id, name, filtered)
        }
    }
    return found
}

const listLayoutProps = computed(() => {
    let spacingBase = 4
    let fontSize = 14
    let iconSize = 22

    if (options.layout === 'compact') {
        spacingBase = 2
        fontSize = 12
        iconSize = 20
    } else if (options.layout === 'comfortable') {
        spacingBase = 5
        fontSize = 14
        iconSize = 24
    }

    return {'--list-spacing-base': spacingBase + 'px', '--list-font-size': fontSize + 'px', '--list-icon-size': iconSize + 'px'}
})

const notGroupedByUser = computed<ExtensionGroup>(() => {
    let lists = extensions

    const array = lists.filter(ext => {
        return !userGroupSetup.some(group => {
            return group.order.some(id => id === ext.id)
        })
    })

    array.sort((a, b) => {
        return a.name.localeCompare(b.name)
    })

    return new ExtensionGroup('others', msg('others'), array)
})

const shownGroups = computed<DefaultExtensionGroups>(() => {
    const { showUserGroupsOnly } = options

    if (currentTab.value === 1 || showUserGroupsOnly) {

        if (showUserGroupsOnly) {
            // add a 'Other' group
            Object.assign(userExtensionGroups, { 'others': notGroupedByUser })
        }

        if (searchTerm.value) {
            return getSearchResults(searchTerm.value, userExtensionGroups)
        }
        return userExtensionGroups
    } else {
        if (searchTerm.value) {
            return getSearchResults(searchTerm.value, defaultExtensionGroups)
        }
        return defaultExtensionGroups
    }
})

const transitionName = computed(()=> {
    return currentTab.value === 0 ? 'slide-left' : 'slide-right'
})

const showEnableAll = computed(() => {
    if (options.showEnableAllButton) {
        return currentTab.value === 1 || options.showUserGroupsOnly
    } else {
        return false
    }
})

watch(currentTab, (val) => {
    chrome.runtime.sendMessage({ type: "SET_OPTIONS", data: {selectedTab: val} })
})
</script>

<template>
    <div v-if="options.enabledSearch" class="search-container">
        <ExtInput v-model:value="searchTerm" />
    </div>

    <main
        class="lists-container"
        :class="!options.useNativeScrollbar && 'lists-container--styled-scrollbar'"
        :id="`panel-${currentTab}`"
        :style="{...listLayoutProps}"
        tabindex="0"
        @keydown.left.prevent="currentTab = currentTab === 0 ? 1 : 0"
        @keydown.right.prevent="currentTab = currentTab === 0 ? 1 : 0"
    >

        <TransitionGroup :name="transitionName" v-if="Object.entries(shownGroups).length > 0">
        <template v-for="([id, {extensions, name}], i) in Object.entries(shownGroups)" :key="id">
            <ExtGroup
                v-if="extensions.length > 0"
                :id="id"
                :title="name"
                :description="extensions.filter((item: chrome.management.ExtensionInfo) => item?.enabled).length + ' / ' + extensions.length"
                :items="extensions"
                :collapsed="collapsed.includes(id)"
                :enabled="extensions.every((item: chrome.management.ExtensionInfo) => item?.enabled)"
                @update:collapsed="groupToggleCollapsed(id)"
                @update:enabled="setGroupEnabled(id, $event)"
                :showEnableAll="showEnableAll"
            >

                <template #item="{item}: {item: chrome.management.ExtensionInfo}">
                    <ExtList
                        v-model:enabled="item.enabled"
                        :id="item.id"
                        :icons="item.icons"
                        :mayDisable="item.mayDisable"
                        :mayEnable="((item as any).mayEnable)"
                        :disabledReason="item.disabledReason"
                        :optionsUrl="item.optionsUrl"
                        :title="options.displayFullName ? item.name : (item.shortName || item.name)"
                        :description="options.showExtensionDescriptionOnHover ? item.description : undefined"
                        :highlight="options.highlightSideLoadExtensions && (item.installType !== 'normal')"
                        :isApp="item.type.includes('app')"
                        @update:enabled="setEnabled(item.id, $event)"
                    />
                </template>

            </ExtGroup>
        </template>
        </TransitionGroup>

        <div class="lists-container__empty" v-else-if="hasInit">
            <ExtEmpty :title="msg('no_results')" />
        </div>
    </main>

    <div class="tab-bar-container" v-if="userGroupSetup.length > 0 && !options.showUserGroupsOnly" role="presentation">
        <ExtTabBar v-model="currentTab" :tabs="tabItems" />
    </div>
</template>

<style lang="postcss" scoped>

.search-container {
    box-sizing: border-box;
    width: 100%;
    padding: 16px var(--horizontal-padding) 8px;
}

.lists-container {
    --scrollbar-thumb-color-rgb: 0, 0, 0;

    @media (prefers-color-scheme: dark) {
        --scrollbar-thumb-color-rgb: 255, 255, 255;
    }

    box-sizing: border-box;
    overflow: auto;
    flex: 1;
    padding-bottom: var(--spacing-2);

    &--styled-scrollbar {
        &::-webkit-scrollbar {
            width: 16px;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
        }

        &::-webkit-scrollbar-thumb {
            background: rgba(var(--scrollbar-thumb-color-rgb), 0);
            border: 4px solid transparent;
            border-radius: 100px;
            background-clip: content-box;

            &:hover {
                background: rgba(var(--scrollbar-thumb-color-rgb), 0.2);
            }
        }

        &:hover {
            &::-webkit-scrollbar-thumb {
                background: rgba(var(--scrollbar-thumb-color-rgb), 0.1);
                border: 4px solid transparent;
                border-radius: 100px;
                background-clip: content-box;
            }
        }
    }

    &__empty {
        display: grid;
        place-items: center;
        height: 100%;
    }
}

.tab-bar-container {
    position: relative;
    z-index: 1;
    background: var(--surface);
}

.slide-left-move,
.slide-right-move,
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.16s ease, opacity 0.1s linear;
}

.slide-right-enter-from,
.slide-left-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-enter-from,
.slide-right-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-left-leave-active,
.slide-right-leave-active {
  position: absolute;
}
</style>
