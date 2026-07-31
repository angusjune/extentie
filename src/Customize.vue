
<script setup lang="ts">
import { ref, computed, toRaw, watch } from 'vue'
import { Sortable } from "sortablejs-vue3"
import ExtTextField from "@/components/ExtTextField.vue"
import ExtList from "@/components/ExtList.vue"
import ExtIconButton from "@/components/ExtIconButton.vue"
import KrButton from "@/components/KrButton.vue"
import KrDialog from "@/components/KrDialog.vue"
import Add from '~icons/material-symbols/add-rounded'
import Delete from '~icons/material-symbols/delete-rounded'
import DragHandle from '~icons/material-symbols/drag-indicator'
import { msg } from '@/utils/i18n'
import { uuid } from '@/utils/uuid'
import { sanitizeGroupIds } from '@/utils/group-id'
import { searchExtensions, ungrouped, groupByUserGroups } from '@/utils/group-view'
import { moveExtensionsToGroup } from '@/utils/group-move'
import { SystemGroupIds } from '@/ExtensionGroup'

type Extension = chrome.management.ExtensionInfo

// change page title
document.title = msg('customize_title')

const extensions = ref<Extension[]>([])
const options = ref<ExtentieOptions>({} as ExtentieOptions)
const searchTerm = ref<string>('')

// One list, both saved and rendered. Holding a second copy for the drag targets let
// the two drift apart: a reorder only reached the saved one, while an edit to a name
// reached both — through the object they still shared — and saved on every keystroke.
const groups = ref<UserGroupInfo[]>([])
const selectionMode = ref(false)
const selectedExtensionIds = ref<Set<string>>(new Set())
const destinationGroupId = ref('')
const moveStatus = ref('')

chrome.runtime.sendMessage({ type: "GET_ALL" }, (res: {extensions: Extension[], options: ExtentieOptions, userGroups: OptionsUserGroups}) => {
    extensions.value = res.extensions
    options.value = res.options
    groups.value = sanitizeGroupIds(res.userGroups.userGroups)
})

chrome.runtime.onMessage.addListener(({ type, data }: Message, sender, sendResponse) => {
    if (type === 'EXT_CHANGED') {
        extensions.value = data
    }
})

const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
chrome.runtime.sendMessage({ type: "SET_COLOR_SCHEME", data: { colorScheme: isDarkMode ? 'dark' : 'light' } })

/** Saved from each edit rather than from a watcher, so opening the page is not one. */
function saveGroups() {
    chrome.runtime.sendMessage({ type: "SET_USER_GROUPS", data: { userGroups: toRaw(groups.value) } })
}

// The ids a group holds, resolved to the extensions still installed. Sortable reads
// the new order back off the rendered `data-id` attributes.
const groupContents = computed(() => groupByUserGroups(extensions.value, groups.value))

function extensionsIn(group: UserGroupInfo): Extension[] {
    return groupContents.value.get(group.id)?.extensions ?? []
}

const selectedCount = computed(() => selectedExtensionIds.value.size)

function startSelection() {
    selectionMode.value = true
    selectedExtensionIds.value = new Set()
    destinationGroupId.value = ''
    moveStatus.value = ''
}

function finishSelection() {
    selectionMode.value = false
    selectedExtensionIds.value = new Set()
    destinationGroupId.value = ''
}

function cancelSelection() {
    moveStatus.value = ''
    finishSelection()
}

function setExtensionSelected(id: string, selected: boolean) {
    const next = new Set(selectedExtensionIds.value)

    if (selected) next.add(id)
    else next.delete(id)

    selectedExtensionIds.value = next
}

function selectedIdsInPageOrder(): string[] {
    const selected = selectedExtensionIds.value
    const ordered = [
        ...allUngroupedExtensions.value.map(extension => extension.id),
        ...groups.value.flatMap(group => group.order),
    ]

    return [...new Set([...ordered, ...selected])].filter(id => selected.has(id))
}

function moveSelectedExtensions() {
    if (selectedCount.value === 0 || !destinationGroupId.value) return

    const destinationId = destinationGroupId.value === SystemGroupIds.OTHERS
        ? null
        : destinationGroupId.value
    const destinationName = destinationId === null
        ? msg('ungrouped')
        : groups.value.find(group => group.id === destinationId)?.name?.trim() || msg('untitled_group')
    const moved = moveExtensionsToGroup(groups.value, selectedIdsInPageOrder(), destinationId)

    if (moved === groups.value) return

    groups.value = moved
    saveGroups()
    moveStatus.value = msg('move_done', [destinationName])
    finishSelection()
}

function createGroup() {
    groups.value = [...groups.value, { id: uuid(), name: msg('new_group'), order: [] }]
    saveGroups()
}

function setGroups(sortable: typeof Sortable) {
    const order: string[] = sortable.toArray()

    groups.value = [...groups.value].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
    saveGroups()
}

function setGroupExtensions(sortable: typeof Sortable) {
    const groupId: UserGroupInfo['id']  = sortable.el.id
    const order: UserGroupInfo['order'] = sortable.toArray()

    groups.value = groups.value.map(group => (group.id === groupId ? { ...group, order } : group))
    saveGroups()
}

function discardMovedDomElement({ item }: { item: HTMLElement }) {
    // sortablejs-vue3 renders `list`, but deliberately does not keep it in sync.
    // Sortable has already moved this node; after the store callbacks update groups,
    // Vue renders the extension at its new position and would leave this node behind.
    queueMicrotask(() => item.remove())
}

// Deleting a group throws away an arrangement that took some work to build, and the
// only way back is to make it again, so the delete button asks first.
const pendingDelete = ref<UserGroupInfo>()

function requestRemoveGroup(group: UserGroupInfo) {
    pendingDelete.value = group
}

function cancelRemoveGroup() {
    pendingDelete.value = undefined
}

function confirmRemoveGroup() {
    if (!pendingDelete.value) return

    removeGroup(pendingDelete.value.id)
    pendingDelete.value = undefined
}

function removeGroup(id: string) {
    groups.value = groups.value.filter(group => group.id !== id)
    saveGroups()
}

const pendingDeleteName = computed(() => pendingDelete.value?.name?.trim() || msg('untitled_group'))

function sortUngrouped(sortable: typeof Sortable) {
    // place ungrouped extensions id in array
    const order = ungroupedExtensions.value.map(ext => ext.id)
    // sort list
    sortable.sort(order, true)
}

const allUngroupedExtensions = computed(() => ungrouped(extensions.value, groups.value, '').extensions)

const ungroupedExtensions = computed(() => {
    return searchTerm.value
        ? searchExtensions(searchTerm.value, allUngroupedExtensions.value)
        : allUngroupedExtensions.value
})

const canMoveSelection = computed(() => {
    if (selectedCount.value === 0 || !destinationGroupId.value) return false

    const destinationId = destinationGroupId.value === SystemGroupIds.OTHERS
        ? null
        : destinationGroupId.value

    return moveExtensionsToGroup(
        groups.value,
        selectedIdsInPageOrder(),
        destinationId,
    ) !== groups.value
})

watch(extensions, installedExtensions => {
    const installedIds = new Set(installedExtensions.map(extension => extension.id))
    const installedSelected = new Set([...selectedExtensionIds.value].filter(id => installedIds.has(id)))

    if (installedSelected.size !== selectedExtensionIds.value.size) {
        selectedExtensionIds.value = installedSelected
    }
})
</script>

<template>
    <div class="container">
        <div class="selection-toolbar">
            <div class="selection-toolbar__surface" v-if="selectionMode">
                <span class="selection-toolbar__count" aria-live="polite">
                    {{ msg('selected_extensions', [String(selectedCount)]) }}
                </span>
                <label class="selection-toolbar__destination">
                    <span class="visually-hidden">{{ msg('move_to_group') }}</span>
                    <select v-model="destinationGroupId" :disabled="selectedCount === 0">
                        <option value="" disabled>{{ msg('move_to_group') }}</option>
                        <option :value="SystemGroupIds.OTHERS">{{ msg('ungrouped') }}</option>
                        <option v-for="group in groups" :key="group.id" :value="group.id">
                            {{ group.name?.trim() || msg('untitled_group') }}
                        </option>
                    </select>
                </label>
                <KrButton
                    variant="primary"
                    :disabled="!canMoveSelection"
                    @click="moveSelectedExtensions"
                >
                    {{ msg('move') }}
                </KrButton>
                <KrButton variant="plain" @click="cancelSelection">{{ msg('cancel') }}</KrButton>
            </div>
            <KrButton
                v-else-if="groups.length > 0 && extensions.length > 0"
                variant="secondary"
                @click="startSelection"
            >
                {{ msg('select_extensions') }}
            </KrButton>
        </div>
        <div class="visually-hidden" role="status" aria-live="polite">{{ moveStatus }}</div>

        <section class="section">
            <div class="card">
                <header class="card__header card__header--column">
                    <h1 class="card__title">{{ msg('ungrouped') }}</h1>
                    <div class="card__search">
                        <ExtTextField v-model:value="searchTerm" />
                    </div>
                </header>


                <Sortable
                    :list="ungroupedExtensions"
                    class="card__content"
                    item-key="id"
                    tag="div"
                    :options="{
                        group: 'extLists',
                        animation: 150,
                        sort: false,
                        disabled: selectionMode,
                        store: {
                            set: sortUngrouped,
                        },
                    }"
                    @add="discardMovedDomElement"
                >
                    <template #item="{element}: {element: Extension}">
                        <ExtList
                            v-bind="element"
                            :data-id="element.id"
                            :title="element.name"
                            :showActions="false"
                            :selectable="selectionMode"
                            :selected="selectedExtensionIds.has(element.id)"
                            :selectionLabel="msg('select_extension', [element.name])"
                            :isApp="element.type.includes('app')"
                            :highlight="options.highlightSideLoadExtensions && (element.installType !== 'normal')"
                            @update:selected="setExtensionSelected(element.id, $event)"
                        />
                    </template>
                </Sortable>
            </div>
        </section>

        <section class="section">

            <Sortable
                :list="groups"
                item-key="id"
                tag="div"
                :options="{
                    group: 'extGroups',
                    animation: 150,
                    handle: '.handle',
                    disabled: selectionMode,
                    dragClass: 'card--dragging',
                    ghostClass: 'card--ghost',
                    store: { set: setGroups },
                }"
                :style="{ marginBottom: 16}"
            >

            <template  #item="{ element: group }: {element: UserGroupInfo}">

                <div class="card" :data-id="group.id">
                    <header class="card__header">
                        <DragHandle v-if="!selectionMode" class="handle" />
                        <input class="card__title card__title--input" type="text" aria-label="group name" v-model="group.name" @input="saveGroups" maxlength="40" />
                        <div class="card__actions">
                            <ExtIconButton @click="requestRemoveGroup(group)" :aria-label="msg('delete_group')"><Delete /></ExtIconButton>
                        </div>
                    </header>
                    <Sortable
                        :id="group.id"
                        class="group-card"
                        :list="extensionsIn(group)"
                        item-key="id"
                        tag="div"
                        :options="{
                            group: 'extLists',
                            animation: 150,
                            disabled: selectionMode,
                            store: { set: setGroupExtensions },
                        }"
                        @add="discardMovedDomElement"
                        :data-empty-text="msg('drop_here')"
                    >
                        <template #item="{element}: {element: Extension}">
                            <ExtList
                                v-bind="element"
                                :data-id="element.id"
                                :title="element.name"
                                :showActions="false"
                                :selectable="selectionMode"
                                :selected="selectedExtensionIds.has(element.id)"
                                :selectionLabel="msg('select_extension', [element.name])"
                                :isApp="element.type.includes('app')"
                                :highlight="options.highlightSideLoadExtensions && (element.installType !== 'normal')"
                                @update:selected="setExtensionSelected(element.id, $event)"
                            />
                        </template>
                    </Sortable>
                </div>

            </template>

            </Sortable>

            <div class="add-card" @click="createGroup" role="button">
                <Add aria-hidden="true" />
                <span>{{msg('new_group')}}</span>
            </div>

        </section>

        <KrDialog :open="!!pendingDelete" :title="msg('delete_group')" @close="cancelRemoveGroup">
            <div class="confirm">{{ msg('delete_group_confirm', [pendingDeleteName]) }}</div>
            <template #actions>
                <KrButton variant="plain" @click="cancelRemoveGroup">{{ msg('cancel') }}</KrButton>
                <KrButton variant="primary" @click="confirmRemoveGroup">{{ msg('delete') }}</KrButton>
            </template>
        </KrDialog>

    </div>

</template>

<style lang="postcss" scoped>
.container {
    max-width: 80vw;
    width: clamp(300px, 80vw, 900px);
    max-height: 100vh;
    overflow: hidden;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto 1fr;
    margin: auto;
}

.selection-toolbar {
    position: sticky;
    top: 0;
    z-index: 10;
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    min-height: 44px;
    box-sizing: border-box;
    padding: 12px 16px;
    background: var(--background);

    &__surface {
        width: 100%;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        box-sizing: border-box;
        padding: 8px 12px;
        border: 1px solid var(--separator);
        border-radius: 8px;
        background: var(--surface);
    }

    &__count {
        margin-right: auto;
        font-size: 13px;
        font-weight: 500;
        color: var(--on-surface-primary);
        white-space: nowrap;
    }

    &__destination {
        min-width: 0;

        select {
            width: min(240px, 30vw);
            height: 32px;
            box-sizing: border-box;
            border: 1px solid var(--on-surface-tertiary);
            border-radius: 4px;
            padding: 0 28px 0 8px;
            font-family: inherit;
            font-size: 13px;
            color: var(--on-surface-primary);
            background: var(--form-field);

            &:focus-visible {
                outline: 2px solid var(--theme);
                outline-offset: 1px;
            }

            &:disabled {
                color: var(--on-surface-tertiary);
            }
        }
    }
}

.section {
    padding: 16px 16px 32px;
    overflow-y: auto;

    .card:not(:last-child) {
        margin-bottom: 16px;
    }
}

.card {
    display: flex;
    flex-direction: column;
    max-height: 100%;
    background: var(--surface);
    border-radius: 16px;
    overflow: hidden;

    &:hover, &:focus {
        .card__actions {
            visibility: visible;
        }
    }

    &--ghost {
        height: 2px;
        overflow: hidden;
        background: var(--on-surface-tertiary);

        .card__header {
            display: none;
        }
    }

    &__header {
        padding: var(--horizontal-padding);
        background: var(--surface);
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 8px;

        &--column {
            flex-direction: column;
            align-items: flex-start;
        }
    }

    &__content {
        flex: 1;
        overflow: auto;
    }

    &__actions {
        opacity: 0.5;
        visibility: hidden;
    }

    &__title {
        font-size: 18px;
        font-weight: 500;
        color: var(--on-surface-primary);
        margin: 0;
        text-overflow: ellipsis;
        flex: 1;

        &--input {
            background: transparent;
            border: 0;
            padding: 0;

            &:hover, &:focus {
                outline: 0;
                box-shadow: 0 7px 0 0 var(--surface), 0 8px 0 0 var(--separator);
            }
        }
    }

    &__search {
        padding-top: 8px;
        width: 100%;
    }

    .handle {
        cursor: grab;
        font-size: 18px;
        opacity: 0.35;
        color: var(--on-surface-secondary);

        &:active {
            opacity: 0.8;
        }
    }
}

.confirm {
    font-size: 14px;
    color: var(--on-surface-primary);
}

.add-card {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 14px;
    border-radius: 16px;
    border: 1px dashed var(--on-surface-tertiary);
    height: 100px;
    cursor: default;
    color: var(--on-surface-secondary);

    &:hover, &:focus {
        background: rgba(0,0,0,.06);
    }
}

.group-card:empty {
    position: relative;
    min-height: 46px;
    border: 1px dashed var(--separator);
    border-radius: 0 0 16px 16px;

    &:after {
        content: attr(data-empty-text);
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 14px;
        color: var(--on-surface-tertiary);
    }
}

.sortable-drag {
    opacity: .5;
    border-radius: 8px;
    overflow: hidden;
}

.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

@media (max-width: 700px) {
    .container {
        width: min(100%, 520px);
        max-width: none;
        grid-template-columns: 1fr;
    }

    .selection-toolbar {
        position: static;

        &__surface {
            flex-wrap: wrap;
        }

        &__count {
            width: 100%;
        }

        &__destination {
            flex: 1;

            select {
                width: 100%;
            }
        }
    }

    .section--fixed {
        position: static;
        max-height: none;
    }
}

</style>
