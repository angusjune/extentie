
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

const extensions: chrome.management.ExtensionInfo[] = reactive([])
const userGroupSetup: UserGroupInfo[] = reactive([])
const tempUserGroupSetup: UserGroupInfo[] = reactive([])
const searchTerm = ref<string>('')

chrome.runtime.sendMessage({ type: "GET_ALL" }, (res: {extensions: chrome.management.ExtensionInfo[], options: Options, userGroups: OptionsUserGroups}) => {
    Object.assign(extensions, res.extensions)
    Object.assign(userGroupSetup, res.userGroups.userGroups)
    Object.assign(tempUserGroupSetup, res.userGroups.userGroups)

    // console.log('get from storage', userGroupSetup)
})

chrome.runtime.onMessage.addListener(({ type, data }: Message, sender, sendResponse) => {
    if (type === 'EXT_CHANGED') {
        Object.assign(extensions, data)
    }
})

function getExtInfoFromId(id: chrome.management.ExtensionInfo['id']) {
    return extensions.find(ext => ext.id === id)
}

function createGroup() {
    const newGroup: UserGroupInfo = {
        id: uuid(),
        name: 'New Group',
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
    let lists = extensions
    
    if (searchTerm) {
        lists = extensions.filter(ext => {
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
                    <h1 class="card__title">Ungrouped</h1>
                    <div class="card__search">
                        <ExtTextField v-model:value="searchTerm" />
                    </div>
                </header>
                

                <Sortable
                    :list="ungroupedExtensions"
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
                    <template #item="{element}">
                        <ExtList
                            v-bind="element"
                            :data-id="element.id"
                            :title="element.name" 
                            :showActions="false"
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
                        <input class="card__title card__title--input" type="text" aria-label="group name" v-model="group.name" @change="e=>setGroupName(e, group.id)" maxlength="40" />
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
                    >
                        <template #item="{element: id}">
                            <ExtList
                                v-if="getExtInfoFromId(id)"
                                v-bind="getExtInfoFromId(id)"
                                :data-id="id"
                                :title="getExtInfoFromId(id)?.name"
                                :showActions="false"
                            />
                        </template>
                    </Sortable>
                </div>

            </template>

            </Sortable>

            <div class="add-card" @click="createGroup" role="button">
                <Add />
                <span>New group</span>
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
    max-height: 100%;
    background: var(--surface);
    border-radius: 16px;
    overflow: hidden auto;

    &:hover, &:focus {
        .card__actions {
            visibility: visible;
        }
    }

    &--dragging {

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
        position: sticky;
        top: 0;
        z-index: 1;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 8px;

        &--column {
            flex-direction: column;
            align-items: flex-start;
        }
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
        content: 'Drop here';
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