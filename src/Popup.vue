<script setup lang="ts">
import { watch, ref, shallowRef, reactive, computed } from 'vue'
import { SystemGroupIds, type ExtensionGroups } from './ExtensionGroup'
import { groupByType, groupByUserGroups, ungrouped, searchGroups, carryOrderForward } from '@/utils/group-view'
import { sanitizeGroupIds } from '@/utils/group-id'
import {
    addCollapsedGroups,
    parseCollapsedGroups,
    removeCollapsedGroups,
    serializeCollapsedGroups,
} from '@/utils/collapsed-groups'
import ExtInput from '@/components/ExtTextField.vue'
import ExtList from '@/components/ExtList.vue'
import ExtGroup from '@/components/ExtGroup.vue'
import ExtTabBar from '@/components/ExtTabBar.vue'
import ExtEmpty from '@/components/ExtEmpty.vue'
import ExtIconButton from '@/components/ExtIconButton.vue'
import Settings from '~icons/material-symbols/settings-rounded'
import CollapseAll from '~icons/material-symbols/unfold-less-rounded'
import ExpandAll from '~icons/material-symbols/unfold-more-rounded'
import { msg } from '@/utils/i18n'

type Extension = chrome.management.ExtensionInfo

const groupTitles: Partial<Record<Extension['type'], string>> = {
    'extension': msg('extensions'),
    'login_screen_extension': msg('extensions'),
    'packaged_app': msg('applications'),
    'legacy_packaged_app': msg('applications'),
    'hosted_app': msg('applications'),
    'theme': msg('themes'),
}

const titleOf = (type: Extension['type']) => groupTitles[type] || type

const extensions = ref<Extension[]>([])
const options = reactive(<ExtentieOptions>{})
const userGroupSetup = ref<UserGroupInfo[]>([])

// Row order settles when a row first appears and stays put while the user toggles, so
// a row never slides out from under the cursor mid-click.
const rowOrder = shallowRef<ReadonlyMap<string, boolean>>(new Map())

function setExtensions(list: Extension[]) {
    extensions.value = list
    rowOrder.value = carryOrderForward(rowOrder.value, list)
}

const currentTab = ref(0)
const collapsed = ref<string[]>([])
const searchTerm = ref<string>('')

const tabItems = [msg('all'), msg('groups')]

const hasInit = ref(false)

chrome.runtime.sendMessage(<Message>{ type: "GET_ALL" }, (res: {extensions: Extension[], options: ExtentieOptions, userGroups: OptionsUserGroups}) => {
    setExtensions(res.extensions)
    userGroupSetup.value = sanitizeGroupIds(res.userGroups.userGroups)
    Object.assign(options, res.options)

    collapsed.value = parseCollapsedGroups(res.options.collapsed)
    currentTab.value = res.options.selectedTab

    document.documentElement.style.height = res.options.popupHeight + 'px'

    hasInit.value = true
})

const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
chrome.runtime.sendMessage({ type: "SET_COLOR_SCHEME", data: { colorScheme: isDarkMode ? 'dark' : 'light' } })

chrome.runtime.onMessage.addListener(({ type, data }: Message, sender, sendResponse) => {
    if (type === 'EXT_CHANGED') {
        setExtensions(data)
    }
})

function setEnabled(id: Extension['id'], enabled: boolean) {
    // The toggle has already flipped, so follow the state the background reports
    // back: a refused or failed change puts it right again.
    chrome.runtime.sendMessage({ type: "SET_ENABLED", data: { id, enabled } }).then((res: {id: string, enabled: boolean}) => {
        const extension = extensions.value.find(ext => ext.id === id)
        if (extension) extension.enabled = res.enabled
    })
}

function setGroupEnabled(id: string, enabled: boolean) {
    const group = userGroupSetup.value.find(group => group.id === id)
    if (!group) return

    for (const ext of group.order) {
        setEnabled(ext, enabled)
    }
}

function groupToggleCollapsed(id: string) {
    collapsed.value = collapsed.value.includes(id)
        ? collapsed.value.filter(collapsedId => collapsedId !== id)
        : [...collapsed.value, id]

    chrome.runtime.sendMessage({ type: "SET_OPTIONS", data: { collapsed: serializeCollapsedGroups(collapsed.value) } })
}

const listLayoutProps = computed(() => {
    let spacingBase = 4
    let fontSize = 14
    let iconSize = 22
    let checkboxSize = 18

    if (options.layout === 'compact') {
        spacingBase = 2
        fontSize = 12
        iconSize = 20
        checkboxSize = 16
    } else if (options.layout === 'comfortable') {
        spacingBase = 5
        fontSize = 14
        iconSize = 24
        checkboxSize = 20
    }

    return {
        '--list-spacing-base': spacingBase + 'px',
        '--list-font-size': fontSize + 'px',
        '--list-icon-size': iconSize + 'px',
        '--list-checkbox-size': checkboxSize + 'px',
    }
})

// Derived rather than rebuilt by hand, so uninstalling the last member of a group
// takes the group with it instead of leaving the old one behind.
const defaultExtensionGroups = computed<ExtensionGroups>(
    () => groupByType(extensions.value, titleOf, options.enabledExtensionsOnTop ? rowOrder.value : 'name'))

const userExtensionGroups = computed<ExtensionGroups>(
    () => groupByUserGroups(extensions.value, userGroupSetup.value))

const userGroupIdsWithExtensions = computed(() =>
    [...userExtensionGroups.value]
        .filter(([, group]) => group.extensions.length > 0)
        .map(([id]) => id))

const allGroupsCollapsed = computed(() =>
    userGroupIdsWithExtensions.value.length > 0
    && userGroupIdsWithExtensions.value.every(id => collapsed.value.includes(id)))

const toggleAllGroupsLabel = computed(() =>
    allGroupsCollapsed.value ? msg('expand_all_groups') : msg('collapse_all_groups'))

function toggleAllGroupsCollapsed() {
    if (userGroupIdsWithExtensions.value.length === 0) return

    collapsed.value = allGroupsCollapsed.value
        ? removeCollapsedGroups(collapsed.value, userGroupIdsWithExtensions.value)
        : addCollapsedGroups(collapsed.value, userGroupIdsWithExtensions.value)
    chrome.runtime.sendMessage({ type: "SET_OPTIONS", data: { collapsed: serializeCollapsedGroups(collapsed.value) } })
}

const notGroupedByUser = computed(
    () => ungrouped(extensions.value, userGroupSetup.value, msg('others')))

const shownGroups = computed<ExtensionGroups>(() => {
    const showingUserGroups = currentTab.value === 1 || options.showUserGroupsOnly

    let groups = showingUserGroups ? userExtensionGroups.value : defaultExtensionGroups.value

    if (options.showUserGroupsOnly) {
        groups = new Map(groups).set(SystemGroupIds.OTHERS, notGroupedByUser.value)
    }

    return searchTerm.value ? searchGroups(searchTerm.value, groups) : groups
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

// The options page takes the focus the popup lives on, so the popup closes behind it.
function openOptions() {
    chrome.runtime.openOptionsPage()
}
</script>

<template>
    <div
        v-if="options.enabledSearch || options.showSettingsButton || (currentTab === 1 && !options.showUserGroupsOnly)"
        class="search-container"
    >
        <ExtInput v-if="options.enabledSearch" class="search-container__field" v-model:value="searchTerm" />

        <ExtIconButton
            v-if="currentTab === 1 && !options.showUserGroupsOnly"
            class="search-container__action"
            :disabled="userGroupIdsWithExtensions.length === 0"
            :aria-label="toggleAllGroupsLabel"
            :title="toggleAllGroupsLabel"
            @click="toggleAllGroupsCollapsed"
        >
            <ExpandAll v-if="allGroupsCollapsed" />
            <CollapseAll v-else />
        </ExtIconButton>

        <ExtIconButton
            v-if="options.showSettingsButton"
            class="search-container__action"
            :aria-label="msg('open_option')"
            :title="msg('open_option')"
            @click="openOptions"
        >
            <Settings />
        </ExtIconButton>
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

        <TransitionGroup :name="transitionName" v-if="shownGroups.size > 0">
        <template v-for="[id, group] in shownGroups" :key="id">
            <ExtGroup
                v-if="group.extensions.length > 0"
                :id="id"
                :title="group.name"
                :description="group.extensions.filter((item: Extension) => item.enabled).length + ' / ' + group.extensions.length"
                :items="group.extensions"
                :collapsed="collapsed.includes(id)"
                :enabled="group.extensions.every((item: Extension) => item.enabled)"
                @update:collapsed="groupToggleCollapsed(id)"
                @update:enabled="setGroupEnabled(id, $event)"
                :showEnableAll="showEnableAll"
            >

                <template #item="{item}: {item: Extension}">
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
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-2);
    width: 100%;
    padding: 16px var(--horizontal-padding) 8px;

    /* The field gives up its width so the button keeps its own. */
    &__field {
        flex: 1;
        min-width: 0;
    }

    &__action {
        flex: none;
        color: var(--on-surface-secondary);
        opacity: 0.5;
        transition: opacity 0.15s ease;

        &:hover, &:focus, &:focus-visible {
            opacity: 0.8;
        }

        &:disabled {
            opacity: 0.25;
        }
    }
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
