
<script setup lang="ts">
import { ref, reactive, watch, computed, toRaw } from 'vue'
import { v4 as uuid } from 'uuid'
import { Sortable } from "sortablejs-vue3"
import ExtTextField from "@/components/ExtTextField.vue"
import ExtList from "@/components/ExtList.vue"
import ExtIconButton from "@/components/ExtIconButton.vue"
import Add from '~icons/material-symbols/add-rounded'
import Delete from '~icons/material-symbols/delete-rounded'
import DragHandle from '~icons/material-symbols/drag-indicator'
import { msg } from '@/utils/i18n'

// change page title
document.title = msg('customize_title')

const extensions = ref<chrome.management.ExtensionInfo[]>([])
const userGroupSetup: UserGroupInfo[] = reactive([])
const tempUserGroupSetup: UserGroupInfo[] = reactive([])
const options = ref<ExtentieOptions>({} as ExtentieOptions)
const searchTerm = ref<string>('')

chrome.runtime.sendMessage({ type: "GET_ALL" }, (res: {extensions: chrome.management.ExtensionInfo[], options: ExtentieOptions, userGroups: OptionsUserGroups}) => {
    extensions.value = res.extensions
    options.value = res.options
    Object.assign(userGroupSetup, res.userGroups.userGroups)
    Object.assign(tempUserGroupSetup, res.userGroups.userGroups)
})

chrome.runtime.onMessage.addListener(({ type, data }: Message, sender, sendResponse) => {
    if (type === 'EXT_CHANGED') {
        extensions.value = data
    }
})

const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
chrome.runtime.sendMessage({ type: "SET_COLOR_SCHEME", data: { colorScheme: isDarkMode ? 'dark' : 'light' } })

function getExtInfoFromId(id: chrome.management.ExtensionInfo['id']) {
    return extensions.value.find(ext => ext.id === id)
}

function createGroup() {
    const newGroup: UserGroupInfo = {
        id: uuid(),
        name: msg('new_group'),
        order: [],
    }

    userGroupSetup.push(newGroup)
    tempUserGroupSetup.push(newGroup)
}

function setGroups(sortable: typeof Sortable) {
    const order = sortable.toArray()

    //sort usergroups by order
    userGroupSetup.sort((a, b) => {
        return order.indexOf(a.id) - order.indexOf(b.id)
    })
}

function setGroupExtensions(sortable: typeof Sortable) {
    const groupId: UserGroupInfo['id']  = sortable.el.id
    const order: UserGroupInfo['order'] = sortable.toArray()
    
    const newGroups: UserGroupInfo[] = userGroupSetup.map(group => {
        if (group.id === groupId) {
            return { ...group, order }
        }
        return group
    })
    Object.assign(userGroupSetup, newGroups)
}

function setGroupName(e: Event, groupId: string) {
    const target = (<HTMLInputElement>e.target)
    const name: UserGroupInfo['name'] = target.value

    const newGroups: UserGroupInfo[] = userGroupSetup.map(group => {
        if (group.id === groupId) {
            return { ...group, name }
        }
        return group
    })
    Object.assign(userGroupSetup, newGroups)
}

function removeGroup(id: string) {
    userGroupSetup.splice(userGroupSetup.findIndex(group => group.id === id), 1)
    tempUserGroupSetup.splice(tempUserGroupSetup.findIndex(group => group.id === id), 1)
}

function sortUngrouped(sortable: typeof Sortable) {
    // place ungrouped extensions id in array
    const order = ungroupedExtensions.value.map(ext => ext.id)
    // sort list
    sortable.sort(order, true)
}

const ungroupedExtensions = computed(() => {
    let lists = extensions.value
    
    if (searchTerm) {
        lists = extensions.value.filter(ext => {
            return (ext.name.toLowerCase().includes(searchTerm.value.toLowerCase()) || ext.shortName.toLowerCase().includes(searchTerm.value))
        })
    }

    const array = lists.filter(ext => {
        return !tempUserGroupSetup.some(group => {
            return group.order.some(id => id === ext.id)
        })
    })

    array.sort((a, b) => {
        return a.name.localeCompare(b.name)
    })

    return array
})

watch(userGroupSetup, val => {
    chrome.runtime.sendMessage({ type: "SET_USER_GROUPS", data: { userGroups: toRaw(val) }})
})
</script>

<template>
    <div class="container">

        <section class="section section--fixed">
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
                        store: {
                            set: sortUngrouped,
                        },
                    }"
                >
                    <template #item="{element}: {element: chrome.management.ExtensionInfo}">
                        <ExtList
                            v-bind="element"
                            :data-id="element.id"
                            :title="element.name" 
                            :showActions="false"
                            :highlight="options.highlightSideLoadExtensions && (element.installType !== 'normal')"
                        />
                    </template>
                </Sortable>
            </div>
        </section>
       
        <section class="section">

            <Sortable
                :list="tempUserGroupSetup"
                item-key="id"
                tag="div"
                :options="{
                    group: 'extGroups',
                    animation: 150,
                    handle: '.handle',
                    dragClass: 'card--dragging',
                    ghostClass: 'card--ghost',
                    store: { set: setGroups },
                }"
                :style="{ marginBottom: 16}"
            >

            <template  #item="{ element: group }: {element: UserGroupInfo}">

                <div class="card" :data-id="group.id">
                    <header class="card__header">
                        <DragHandle class="handle" />
                        <input class="card__title card__title--input" type="text" aria-label="group name" v-model="group.name" @change="setGroupName($event, group.id)" maxlength="40" />
                        <div class="card__actions">
                            <ExtIconButton @click="removeGroup(group.id)"><Delete /></ExtIconButton>
                        </div>
                    </header>
                    <Sortable
                        :id="group.id"
                        class="group-card"
                        :list="group.order"
                        item-key="id"
                        tag="div"
                        :options="{
                            group: 'extLists',
                            animation: 150,
                            store: { set: setGroupExtensions },
                        }"
                        :data-empty-text="msg('drop_here')"
                    >
                        <template #item="{element: id}">
                            <ExtList
                                v-if="getExtInfoFromId(id)"
                                v-bind="getExtInfoFromId(id)"
                                :data-id="id"
                                :title="getExtInfoFromId(id)?.name ?? ''"
                                :showActions="false"
                                :highlight="options.highlightSideLoadExtensions && (getExtInfoFromId(id)?.installType !== 'normal')"
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

    </div>
    
</template>

<style lang="postcss" scoped>
.container {
    max-width: 80vw;
    width: clamp(300px, 80vw, 900px);
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin: auto;
}

.section {
    overflow: hidden;
    padding: 32px 16px;

    .card:not(:last-child) {
        margin-bottom: 16px;
    }

    &--fixed {
        position: sticky;
        top: 0;
        max-height: 90vh;
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

</style>