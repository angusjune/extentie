<script setup lang="ts">
import { onMounted } from 'vue';
import SearchBar from '../components/SearchBar.vue';
import ExtGroup from '../components/ExtGroup.vue';
import { useExtensions } from '../composables/useExtensions';
import { useSettings } from '../composables/useSettings';

const { query, groups, load, startWatching } = useExtensions();
const { searchEnabled, load: loadSettings } = useSettings();

onMounted(() => {
  void load();
  startWatching();
  void loadSettings();
});
</script>

<template>
  <SearchBar v-if="searchEnabled" v-model="query" />
  <main class="groups" :class="{ 'groups--no-search': !searchEnabled }">
    <ExtGroup v-for="group in groups" :key="group.id" :group="group" />
  </main>
</template>

<style scoped lang="scss">
.groups {
  padding: 60px 0 16px;
}

.groups--no-search {
  padding-top: 16px;
}
</style>
