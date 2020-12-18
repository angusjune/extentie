import {LitElement, html, css} from 'lit-element';

export class ExtCheckbox extends LitElement {
    static get properties() {
        return {
            checked: { type: Boolean },
        };
    }

    static get styles() { 
        return css `
            .ext-list {}
        `;
    }

    constructor() {
        super();
        this.checked = false;
        // this.label = 'djifoa';
    }

    render() {
        return html `
            <label>
                <input type="checkbox" ?checked="${this.checked}" @change="${this._handleChange}" />
                <slot></slot>
            </label>
        `;
    }

    _handleChange() {
        let change = new Event('change');
        this.dispatchEvent(change);
    }

}

customElements.define('ext-checkbox', ExtCheckbox);