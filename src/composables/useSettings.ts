import { ref, watch } from 'vue';

const SETTINGS_DEFAULT = { enabledSearch: true };

const searchEnabled = ref(true);
let loaded = false;

watch(searchEnabled, (value) => {
  if (!loaded) return;
  void chrome.storage.sync.set({ enabledSearch: value });
});

async function load(): Promise<void> {
  const stored = await chrome.storage.sync.get(SETTINGS_DEFAULT);
  searchEnabled.value = stored.enabledSearch;
  loaded = true;
}

export function useSettings() {
  return { searchEnabled, load };
}
