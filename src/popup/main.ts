import { createApp } from 'vue';
import Popup from './Popup.vue';
import { applyTheme } from '../lib/theme';
import './popup.scss';

applyTheme();
createApp(Popup).mount('#app');
