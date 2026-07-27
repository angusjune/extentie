<script lang="ts" setup>
import { ref } from 'vue'
import KrButton from '@/components/KrButton.vue'
import KrButtonRow from '@/components/KrButtonRow.vue'
import KrDialog from '@/components/KrDialog.vue'
import { msg } from '@/utils/i18n'
import { serializeGroups, backupFilename, parseGroupBackup } from '@/utils/group-backup'
import { applyImportedGroups, type ImportMode } from '@/utils/group-merge'
import { downloadTextFile } from '@/utils/download-file'

interface PendingImport {
    filename: string;
    groups: UserGroupInfo[];
}

interface Status {
    type: 'success' | 'error';
    text: string;
}

const props = withDefaults(defineProps<{
    groups: UserGroupInfo[],
    extensions?: chrome.management.ExtensionInfo[],
}>(), {
    extensions: () => [],
})

const emit = defineEmits<{
    (e: 'import', groups: UserGroupInfo[]): void
}>()

const fileInput = ref<HTMLInputElement>()
const pending   = ref<PendingImport>()
const status    = ref<Status>()

function exportGroups() {
    status.value = undefined

    try {
        downloadTextFile(backupFilename(), serializeGroups(props.groups, props.extensions))
    } catch (error) {
        console.error('Failed to export groups:', error)
        status.value = { type: 'error', text: msg('export_error') }
    }
}

async function readBackupFile(event: Event) {
    const input = event.target as HTMLInputElement
    const file  = input.files?.[0]

    // Reset so picking the same file again still fires a change event.
    input.value = ''

    if (!file) return

    status.value  = undefined
    pending.value = undefined

    try {
        const groups = parseGroupBackup(await file.text())

        if (groups.length === 0) {
            status.value = { type: 'error', text: msg('import_empty') }
            return
        }

        pending.value = { filename: file.name, groups }
    } catch (error) {
        console.error('Failed to read group backup:', error)
        status.value = { type: 'error', text: msg('import_error') }
    }
}

function confirmImport(mode: ImportMode) {
    if (!pending.value) return

    const { groups } = pending.value

    emit('import', applyImportedGroups(props.groups, groups, mode))

    pending.value = undefined
    status.value  = { type: 'success', text: msg('import_done', [String(groups.length)]) }
}

function cancelImport() {
    pending.value = undefined
}
</script>

<template>
    <KrButtonRow
        :title="msg('export_groups')"
        :subtitle="msg('export_groups_desc')"
        :label="msg('export')"
        :disabled="groups.length === 0"
        @click="exportGroups"
    />

    <KrButtonRow
        :title="msg('import_groups')"
        :subtitle="msg('import_groups_desc')"
        :label="msg('choose_file')"
        :hide-separator="!status"
        @click="fileInput?.click()"
    />

    <input ref="fileInput" type="file" hidden aria-hidden="true" tabindex="-1" @change="readBackupFile" />

    <KrDialog :open="!!pending" :title="msg('import_groups')" @close="cancelImport">
        <div class="import__title" v-if="pending">{{ msg('import_found', [String(pending.groups.length), pending.filename]) }}</div>
        <div class="import__hint">{{ msg('import_hint') }}</div>
        <template #actions>
            <KrButton variant="plain" @click="cancelImport">{{ msg('cancel') }}</KrButton>
            <KrButton @click="confirmImport('replace')">{{ msg('replace') }}</KrButton>
            <KrButton variant="primary" @click="confirmImport('merge')">{{ msg('merge') }}</KrButton>
        </template>
    </KrDialog>

    <div
        class="status"
        :class="`status--${status.type}`"
        v-if="status"
        role="status"
    >{{ status.text }}</div>
</template>

<style lang="postcss" scoped>
.import {
    &__title {
        font-size: 14px;
        color: var(--on-surface-primary);
    }

    &__hint {
        font-size: 12px;
        color: var(--on-surface-secondary);
        padding-top: 4px;
    }
}

.status {
    padding: 12px 20px;
    font-size: 12px;
    border-top: 1px solid var(--separator);

    &--success {
        color: var(--on-surface-secondary);
    }

    &--error {
        color: #d93025;

        @media (prefers-color-scheme: dark) {
            color: #f28b82;
        }
    }
}
</style>
