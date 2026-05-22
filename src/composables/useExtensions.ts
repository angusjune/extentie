import { computed, ref } from 'vue';
import type { Category, ExtensionInfo } from '../types';
import { categorize } from '../types';
import { filterByName } from '../lib/filter';
import { sortExtensions } from '../lib/sort';
import { t } from '../lib/i18n';
import {
  launchApp,
  listExtensions,
  openOptionsPage,
  setEnabled as apiSetEnabled,
  uninstall as apiUninstall,
} from '../lib/extensions';

export interface ExtGroupView {
  id: Category;
  title: string;
  items: ExtensionInfo[];
  enabledCount: number;
  totalCount: number;
}

const all = ref<ExtensionInfo[]>([]);
const query = ref('');
let watching = false;

async function load(): Promise<void> {
  all.value = await listExtensions();
}

/** Subscribe to external install/enable changes so the list stays current. */
function startWatching(): void {
  if (watching) return;
  watching = true;
  const reload = () => {
    void load();
  };
  chrome.management.onInstalled.addListener(reload);
  chrome.management.onUninstalled.addListener(reload);
  chrome.management.onEnabled.addListener(reload);
  chrome.management.onDisabled.addListener(reload);
}

function buildGroup(id: Category, title: string): ExtGroupView {
  const inCategory = all.value.filter((ext) => categorize(ext) === id);
  const items = sortExtensions(filterByName(inCategory, query.value));
  return {
    id,
    title,
    items,
    enabledCount: items.filter((ext) => ext.enabled).length,
    totalCount: items.length,
  };
}

const groups = computed<ExtGroupView[]>(() => [
  buildGroup('extension', t('extensions')),
  buildGroup('app', t('applications')),
  buildGroup('theme', t('themes')),
]);

async function setEnabled(id: string, enabled: boolean): Promise<void> {
  await apiSetEnabled(id, enabled);
  await load();
}

async function uninstall(id: string): Promise<void> {
  try {
    await apiUninstall(id);
  } catch {
    // user cancelled the uninstall confirmation dialog — nothing to do
    return;
  }
  await load();
}

async function launch(id: string): Promise<void> {
  await launchApp(id);
}

async function openOptions(url: string): Promise<void> {
  await openOptionsPage(url);
}

export function useExtensions() {
  return { query, groups, load, startWatching, setEnabled, uninstall, launch, openOptions };
}
