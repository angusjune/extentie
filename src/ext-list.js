import {LitElement, html, css} from 'lit-element';
import {ExtCheckbox} from './ext-checkbox';

export class ExtList extends LitElement {
    static get properties() {
        return {
            id: { type: String },
            enabled: { type: Boolean },
            optionsurl: { type: String },
            isapp: { type: Boolean }
        };
    }

    static get styles() { 
        return css `
            .list {
                display: flex;
                justify-content: space-between;
                padding: 2px 8px;
                transition: all ease-out 0.2s;
            }
            .list--inactive {
                filter: saturate(0);
            }
        `;
    }

    constructor() {
        super();
        this.enabled = false;
        this.isapp = false;
    }

    render() {
        return html `
            <div class="list ${!this.enabled ? 'list--inactive' : ''}" id="${this.id}">
                <div class="list__label">
                    <ext-checkbox ?checked="${this.enabled}" @change="${this._handleCheckboxChange}"><slot></slot></ext-checkbox>
                </div>
                <div class="list__actions">
                    ${this.isapp ? html `<a class="list__actions-item list__actions-item--launch-app" href="#" @click="${this._handleClickLaunchApp}">launch</a>` : html ``}
                    ${this.optionsurl ? 
                        html `<a class="list__actions-item list__actions-item--open-option" href="#" @click="${this._handleClickOption}">option</a>`:
                        html `<span class="list__actions-item list__actions-item--placeholder></span>`
                    }
                    <a class="list__actions-item list__actions-item--delete" href="#" @click="${this._handleClickDelete}">delete</a>
                </div>

            </div>
        `;
    }

    _handleCheckboxChange(e) {
        let event = new CustomEvent('checkbox:change', e);
        this.dispatchEvent(event);
    }

    _handleClickDelete(e) {
        e.preventDefault();
        let event = new CustomEvent('action:click', {
            detail: { type: 'DELETE' }
        });
        this.dispatchEvent(event);
    }

    _handleClickOption(e) {
        e.preventDefault();
        let event = new CustomEvent('action:click', {
            detail: { type: 'OPEN_OPTIONS' },
        });
        this.dispatchEvent(event);
    }

    _handleClickLaunchApp(e) {
        e.preventDefault();
        let event = new CustomEvent('action:click', {
            detail: { type: 'LAUNCH_APP' },
        });
        this.dispatchEvent(event);
    }

}

customElements.define('ext-list', ExtList);