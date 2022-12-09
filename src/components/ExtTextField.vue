<script>
import Search from '~icons/material-symbols/search-rounded'
import Close from '~icons/material-symbols/close-rounded'
import ExtIconButton from '@/components/ExtIconButton.vue'

export default({
    components: { Search, Close, ExtIconButton },
    props: {
        value: String,
    },
    emits: ['update:value'],
    watch: {
        value(val) {
            this.$emit('update:value', val)
            this.$refs.input.focus()
        }
    },
})
</script>

<template>
    <div class="text-field">
        <div class="text-field__icon">
            <slot name="icon">
                <Search />
            </slot>
        </div>

        <input class="text-field__input" type="text" v-model="value" aria-label="search" ref="input" autofocus />

        <div class="text-field__icon" v-if="value">
            <ExtIconButton  @click="value=''">
                <Close />
            </ExtIconButton>
        </div>
    </div>
</template>

<style scoped>
.text-field {
    display: grid;
    grid-template-columns: 32px 1fr 32px;
    background: var(--form-field);
    border-radius: 999px;

    &:focus-within {
        .text-field__icon {
            opacity: 0.8;
        }
    }

    &__input {
        background: transparent;
        border: 0;

        &:focus {
            outline: none;
        }
    }

    &__icon {
        padding: 6px 8px;
        font-size: 18px;
        opacity: 0.5;
        transition: opacity 0.15s ease;
    }
}
</style>