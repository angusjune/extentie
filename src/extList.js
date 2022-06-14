import {LitElement, html, css} from 'lit-element';

export class ExtList extends LitElement {
    static get properties() {
        return {
            id: { type: String },
            enabled: { type: Boolean },
            optionsUrl: { type: String, attribute: 'optionsurl' },
            isApp: { type: Boolean, attribute: 'isapp' },
            title: { type: String },
            iconUrl: { type: String, attribute: 'iconurl' },
            installType: { type: String, attribute: 'installtype' },
        };
    }

    static get styles() { 
        return css `
            :host {
                outline: 0;
            }
            .list {
                display: flex;
                justify-content: space-between;
                align-items: center;
                /* padding: 12px 8px 12px 16px; */
                transition: all ease-out 0.2s;
            }
            :host(:hover) .list, :host(:focus) .list {
                background-color: var(--list-focus-bg);
            }
            .list--inactive {
                filter: saturate(0);
            }

            .list.list--development {
                background-color: var(--list-dev-bg);
                --list-focus-bg: var(--list-dev-focus-bg);

            }
            .list.list--development:hover, .list.list--development:focus {
            }

            .list__checkbox {
                flex-grow: 1;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                -webkit-user-select: none;
                color: var(--text-primary);
                position: relative;
                display: inline-block;
                padding: 12px 0 12px 16px;
            }

            .list__actions {
                display: flex;
                justify-content: space-between;
            }
              
            .list__actions-item {
                display: block;
                width: 18px;
                height: 18px;
                overflow: hidden;
                margin: 0 5px;
                border-radius: 4px;
                background-size: cover;
                background-repeat: no-repeat;
                cursor: pointer;
                transition: opacity ease-out 0.15s;
                opacity: 0.65;
                outline: 0;
            }

            .list__actions-item:hover, .list__actions-item:focus {
                opacity: 1;
            }

            .list__actions-item:focus {
                background-color: var(--list-focus-bg);
            }

            .list__actions-item path {
                fill: var(--list-actions-item-fill);
            }

            .list--app .list__actions-item--placeholder {
                display: none;
            }

            .list__actions-item--delete {
                opacity: 0;
                pointer-events: none;
            }

            :host(:focus) .list__actions-item--delete, :host(:hover) .list__actions-item--delete {
                opacity: 0.65;
                pointer-events: all;
            }

            .list__actions-item--delete:hover, .list__actions-item--delete:focus {
                opacity: 1 !important;
            }

            .checkbox-indicator {
                box-sizing: border-box;
                display: inline-flex;
                justify-content: center;
                align-items: center;
                position: relative;
                top: -1px;
                width: 16px;
                height: 16px;
                border-radius: 2px;
                border: 2px solid var(--checkbox-stroke);
                transition: background 0.1s linear;
                margin-right: 16px;
            }

            .checkbox-indicator:before {
                content: '';
                position: absolute;
                width: 32px;
                height: 32px;
                border-radius: 16px;
                background: var(--checkbox-ripple-color, rgba(26,115,232,0.3));
                left: -10px;
                top: -10px;
                transition: transform 0.12s ease-out;
                transform: scale(0);
            }

            .checkbox-indicator path {
                stroke-dasharray: 12;
                stroke-dashoffset: 12;
                transition: stroke-dashoffset ease-out 0.12s;
            }

            .checkbox-native {
                width: 1;
                height: 1;
                opacity: 0;
                position:absolute;
            }

            .checkbox-native:checked ~ .checkbox-indicator path{
                stroke-dashoffset: 0;
            }

            .checkbox-native:checked ~ .checkbox-indicator {
                background: var(--checkbox-checked-container);
                border-color: var(--checkbox-checked-container);
            }

            .checkbox-native:focus ~ .checkbox-indicator:before {
                transform: scale(1);
            }

            .checkbox-img {
                display: inline-block;
                width: 18px;
                height: 18px;
                vertical-align: bottom;
                margin-right: 8px;
                background-size: contain;
                background-position: center;
                background-repeat: no-repeat;
            }
        `;
    }

    constructor() {
        super();
        this.enabled  = false;
        this.disabled = false;
        this.isApp    = false;
    }

    render() {
        return html `
            <div class="list ${!this.enabled ? 'list--inactive' : ''} ${'list--' + this.installType} ${this.isApp ? 'list--app' : ''}" id="${this.id}">
                <label class="list__checkbox" for="${'cb' + this.id}">
                    <input id="${'cb' + this.id}" class="checkbox-native" type="checkbox" ?checked="${this.enabled}" ?disabled="${this.disabled}" @change="${this._handleCheckboxChange}" />
                    <div class="checkbox-indicator" role="presentation">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 3L4 6L9 1" stroke="#fff" stroke-width="2"/></svg>
                    </div>
                    <div class="checkbox-img" style="background-image:url(${this.iconUrl})"></div>
                    <slot></slot>
                </label>
                <div class="list__actions">
                    <a class="list__actions-item list__actions-item--delete" href="#" @click="${this._handleClickDelete}" tabindex="-1" aria-label="uninstall ${this.title}">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 14.25C4.5 15.075 5.175 15.75 6 15.75H12C12.825 15.75 13.5 15.075 13.5 14.25V5.25H4.5V14.25ZM14.25 3H11.625L10.875 2.25H7.125L6.375 3H3.75V4.5H14.25V3Z" fill="black"/></svg>                    
                    </a>
                    ${this.isApp ? 
                        html `
                        <a class="list__actions-item list__actions-item--launch-app" href="#" @click="${this._handleClickLaunchApp}" tabindex="0" aria-label="launch ${this.title}">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.25 14.25H3.75V3.75H9V2.25H3.75C2.9175 2.25 2.25 2.925 2.25 3.75V14.25C2.25 15.075 2.9175 15.75 3.75 15.75H14.25C15.075 15.75 15.75 15.075 15.75 14.25V9H14.25V14.25ZM10.5 2.25V3.75H13.1925L5.82 11.1225L6.8775 12.18L14.25 4.8075V7.5H15.75V2.25H10.5Z" fill="black"/></svg>                        
                        </a>` : html ``}
                    ${this.optionsUrl&&this.enabled ? 
                        html `
                        <a class="list__actions-item list__actions-item--open-option" href="#" @click="${this._handleClickOption}" tabindex="0" aria-label="open options page of ${this.title}">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.355 9.702C14.382 9.477 14.4 9.243 14.4 9C14.4 8.757 14.382 8.523 14.346 8.298L15.867 7.11C16.002 7.002 16.038 6.804 15.957 6.651L14.517 4.158C14.427 3.996 14.238 3.942 14.076 3.996L12.285 4.716C11.907 4.428 11.511 4.194 11.07 4.014L10.8 2.106C10.773 1.926 10.62 1.8 10.44 1.8H7.55999C7.37999 1.8 7.23599 1.926 7.20899 2.106L6.93899 4.014C6.49799 4.194 6.09299 4.437 5.72399 4.716L3.93299 3.996C3.77099 3.933 3.58199 3.996 3.49199 4.158L2.05199 6.651C1.96199 6.813 1.99799 7.002 2.14199 7.11L3.66299 8.298C3.62699 8.523 3.59999 8.766 3.59999 9C3.59999 9.234 3.61799 9.477 3.65399 9.702L2.13299 10.89C1.99799 10.998 1.96199 11.196 2.04299 11.349L3.48299 13.842C3.57299 14.004 3.76199 14.058 3.92399 14.004L5.71499 13.284C6.09299 13.572 6.48899 13.806 6.92999 13.986L7.19999 15.894C7.23599 16.074 7.37999 16.2 7.55999 16.2H10.44C10.62 16.2 10.773 16.074 10.791 15.894L11.061 13.986C11.502 13.806 11.907 13.563 12.276 13.284L14.067 14.004C14.229 14.067 14.418 14.004 14.508 13.842L15.948 11.349C16.038 11.187 16.002 10.998 15.858 10.89L14.355 9.702V9.702ZM8.99999 11.7C7.51499 11.7 6.29999 10.485 6.29999 9C6.29999 7.515 7.51499 6.3 8.99999 6.3C10.485 6.3 11.7 7.515 11.7 9C11.7 10.485 10.485 11.7 8.99999 11.7Z" fill="black"/></svg>
                        </a>`:
                        html `<span class="list__actions-item list__actions-item--placeholder"></span>`
                    }
                </div>
            </div>
        `;
    }

    changeAttributes() {
        this.setAttribute('enabled', 'enabled');
        this.requestUpdate();
    }

    _handleCheckboxChange(e) {
        let event = new CustomEvent('checkbox:change', {
            detail: e
        });
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