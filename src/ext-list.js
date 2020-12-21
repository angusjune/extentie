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
            .list:hover, .list:focus {
                background-color: var(--list-focus-bg);
            }
            .list--inactive {
                filter: saturate(0);
            }
            list.development {
                background-color: var(--list-dev-bg);
            }
            list.development:hover, list.development:focus {
                background-color: var(--list-dev-focus-bg);
            }

            .list__actions {
                display: flex;
                justify-content: space-between;
            }
              
            .list__actions-item {
                display: block;
                width: 18px;
                height: 18px;
                margin: 0 5px;
                background-size: cover;
                background-repeat: no-repeat;
                cursor: pointer;
                transition: opacity ease-out 0.15s;
            }

            .list__actions-item--placehold {
                cursor: default;
            }

            .list__actions-item--option {
                opacity: 0.8;
            }

            .list__actions-item--option:hover, .list__actions-item--option:focus {
                opacity: 1;
            }

            .list__actions-item--delete {
                visibility: hidden;
            }

            .list__actions-item--delete:hover, .list__actions-item--delete:focus {
                opacity: 1 !important;
            }

            .list-item:focus .list__actions-item--delete, .list-item:hover .list__actions-item--delete {
                visibility: visible;
                opacity: 0.8;
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