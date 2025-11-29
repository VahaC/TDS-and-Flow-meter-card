// tds-flow-card.js
// Home Assistant Lovelace custom card: TDS & Flow monitor

import { LitElement, html, css } from "https://unpkg.com/lit-element@2.5.1/lit-element.js?module";

class TdsFlowCard extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      _config: { attribute: false },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      ha-card {
        padding: 12px 16px;
        box-sizing: border-box;
      }

      .title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
        opacity: 0.85;
      }

      .container {
        display: grid;
        grid-template-areas:
          "tds-in flow tds-out"
          "temp-in flow temp-out";
        grid-template-columns: 1fr auto 1fr;
        grid-template-rows: auto auto;
        column-gap: 16px;
        row-gap: 4px;
        align-items: center;
      }

      .tds-in {
        grid-area: tds-in;
        font-size: 13px;
        display: flex;
        justify-content: flex-start;
        align-items: baseline;
        gap: 4px;
      }

      .temp-in {
        grid-area: temp-in;
        font-size: 12px;
        opacity: 0.85;
        display: flex;
        justify-content: flex-start;
        align-items: baseline;
        gap: 4px;
      }

      .flow {
        grid-area: flow;
        text-align: center;
      }

      .flow-label {
        font-size: 12px;
        opacity: 0.8;
        margin-bottom: 2px;
      }

      .flow-value {
        font-size: 24px;
        font-weight: 700;
        line-height: 1.1;
      }

      .tds-out {
        grid-area: tds-out;
        font-size: 13px;
        display: flex;
        justify-content: flex-end;
        align-items: baseline;
        gap: 4px;
      }

      .temp-out {
        grid-area: temp-out;
        font-size: 12px;
        opacity: 0.85;
        display: flex;
        justify-content: flex-end;
        align-items: baseline;
        gap: 4px;
      }

      .label {
        opacity: 0.8;
      }

      .value {
        font-weight: 600;
      }

      .unit {
        opacity: 0.75;
        font-size: 11px;
      }

      .placeholder {
        opacity: 0.6;
        font-style: italic;
      }
    `;
  }

  setConfig(config) {
    // Basic validation for required config
    if (!config || typeof config !== "object") {
      throw new Error("Invalid configuration for tds-flow-card");
    }

    // Flow is the core of the card, so it is required
    if (!config.flow_entity) {
      throw new Error("You need to define flow_entity in the card configuration");
    }

    this._config = {
      name: "TDS & Flow",
      ...config,
    };
  }

  getCardSize() {
    // Roughly how many grid rows the card occupies
    return 2;
  }

  static getStubConfig(hass, entities) {
    // Try to guess some default entities when user adds the card from the UI
    const all = entities || Object.keys(hass.states || {});
    const sensors = all.filter((e) => e.startsWith("sensor."));

    const findBy = (substring) =>
      sensors.find((e) => e.toLowerCase().includes(substring)) || "";

    return {
      name: "TDS & Flow",
      tds_in_entity: findBy("tds_in") || findBy("tds in"),
      tds_in_temp_entity: findBy("temp_in") || findBy("temperature_in"),
      flow_entity: findBy("flow") || sensors[0] || "",
      tds_out_entity: findBy("tds_out") || findBy("tds out"),
      tds_out_temp_entity: findBy("temp_out") || findBy("temperature_out"),
    };
  }

  render() {
    if (!this._config || !this.hass) {
      return html``;
    }

    const hass = this.hass;
    const c = this._config;

    const getStateObj = (entityId) =>
      entityId && hass.states[entityId] ? hass.states[entityId] : undefined;

    const formatValue = (stateObj, fallbackUnit) => {
      if (!stateObj) {
        return { value: "–", unit: fallbackUnit || "" };
      }
      const state = stateObj.state;
      if (state === "unknown" || state === "unavailable") {
        return { value: "–", unit: fallbackUnit || "" };
      }
      const unit = stateObj.attributes?.unit_of_measurement || fallbackUnit || "";
      return { value: state, unit };
    };

    const tdsIn = formatValue(getStateObj(c.tds_in_entity), "ppm");
    const tempIn = formatValue(getStateObj(c.tds_in_temp_entity), "°C");
    const flow = formatValue(getStateObj(c.flow_entity), "");
    const tdsOut = formatValue(getStateObj(c.tds_out_entity), "ppm");
    const tempOut = formatValue(getStateObj(c.tds_out_temp_entity), "°C");

    const hasFlowEntity = !!c.flow_entity;

    return html`
      <ha-card>
        ${c.name ? html`<div class="title">${c.name}</div>` : ""}
        <div class="container">
          <!-- Left column: TDS IN + temperature IN -->
          <div class="tds-in">
            <span class="label">TDS in:</span>
            <span class="value">${tdsIn.value}</span>
            ${tdsIn.unit ? html`<span class="unit">${tdsIn.unit}</span>` : ""}
          </div>

          <div class="temp-in">
            <span class="label">Temp in:</span>
            <span class="value">${tempIn.value}</span>
            ${tempIn.unit ? html`<span class="unit">${tempIn.unit}</span>` : ""}
          </div>

          <!-- Center: FLOW -->
          <div class="flow">
            <div class="flow-label">Flow</div>
            <div class="flow-value">
              ${hasFlowEntity ? flow.value : html`<span class="placeholder">No flow_entity</span>`}
              ${flow.unit ? html`<span class="unit">${flow.unit}</span>` : ""}
            </div>
          </div>

          <!-- Right column: TDS OUT + temperature OUT -->
          <div class="tds-out">
            <span class="label">TDS out:</span>
            <span class="value">${tdsOut.value}</span>
            ${tdsOut.unit ? html`<span class="unit">${tdsOut.unit}</span>` : ""}
          </div>

          <div class="temp-out">
            <span class="label">Temp out:</span>
            <span class="value">${tempOut.value}</span>
            ${tempOut.unit ? html`<span class="unit">${tempOut.unit}</span>` : ""}
          </div>
        </div>
      </ha-card>
    `;
  }

  // Return the editor element for the UI card editor
  static getConfigElement() {
    return document.createElement("tds-flow-card-editor");
  }
}

/**
 * Card editor: allows to pick entities in the UI when adding/editing the card.
 * This version uses plain <select> elements to avoid lazy-loading issues with ha-entity-picker.
 */
class TdsFlowCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      _config: { attribute: false },
    };
  }

  static get styles() {
    return css`
      .card-config {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 8px 0;
      }

      .group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .group-label {
        font-size: 13px;
        font-weight: 600;
        opacity: 0.85;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .field-label {
        font-size: 12px;
        opacity: 0.8;
      }

      .text-input,
      .select {
        width: 100%;
        box-sizing: border-box;
        padding: 6px 8px;
        border-radius: 4px;
        border: 1px solid var(--primary-text-color, #9e9e9e);
        background: rgba(0, 0, 0, 0.1);
        color: inherit;
        font: inherit;
      }

      .select {
        padding-right: 24px;
      }
    `;
  }

  setConfig(config) {
    this._config = { ...config };
  }

  get _defaultConfig() {
    return {
      name: "TDS & Flow",
      tds_in_entity: "",
      tds_in_temp_entity: "",
      flow_entity: "",
      tds_out_entity: "",
      tds_out_temp_entity: "",
    };
  }

  _valueChanged(ev) {
    if (!this._config) {
      this._config = this._defaultConfig;
    }

    const target = ev.target;
    const configKey = target.configValue;
    if (!configKey) return;

    const value =
      ev.detail && ev.detail.value !== undefined ? ev.detail.value : target.value;

    // Avoid unnecessary updates
    if (this._config[configKey] === value) return;

    if (value === "" || value === undefined) {
      delete this._config[configKey];
    } else {
      this._config = {
        ...this._config,
        [configKey]: value,
      };
    }

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this.hass) {
      return html``;
    }

    const c = {
      ...this._defaultConfig,
      ...(this._config || {}),
    };

    // Collect all sensor entities for dropdowns
    const sensorEntities = Object.keys(this.hass.states)
      .filter((e) => e.startsWith("sensor."))
      .sort((a, b) => a.localeCompare(b));

    const renderSelect = (label, configKey, value) => html`
      <label class="field">
        <span class="field-label">${label}</span>
        <select
          class="select"
          .configValue=${configKey}
          .value=${value || ""}
          @change=${this._valueChanged}
        >
          <option value="">— Not set —</option>
          ${sensorEntities.map(
            (entityId) => html`
              <option value=${entityId}>${entityId}</option>
            `
          )}
        </select>
      </label>
    `;

    return html`
      <div class="card-config">
        <label class="field">
          <span class="field-label">Name (optional)</span>
          <input
            class="text-input"
            type="text"
            .value=${c.name || ""}
            .configValue=${"name"}
            @input=${this._valueChanged}
          />
        </label>

        <div class="group">
          <div class="group-label">TDS In side</div>
          ${renderSelect("TDS in sensor", "tds_in_entity", c.tds_in_entity)}
          ${renderSelect(
            "TDS in temperature sensor",
            "tds_in_temp_entity",
            c.tds_in_temp_entity
          )}
        </div>

        <div class="group">
          <div class="group-label">Flow</div>
          ${renderSelect("Flow sensor (required)", "flow_entity", c.flow_entity)}
        </div>

        <div class="group">
          <div class="group-label">TDS Out side</div>
          ${renderSelect("TDS out sensor", "tds_out_entity", c.tds_out_entity)}
          ${renderSelect(
            "TDS out temperature sensor",
            "tds_out_temp_entity",
            c.tds_out_temp_entity
          )}
        </div>
      </div>
    `;
  }
}

// Register custom elements
if (!customElements.get("tds-flow-card")) {
  customElements.define("tds-flow-card", TdsFlowCard);
}

if (!customElements.get("tds-flow-card-editor")) {
  customElements.define("tds-flow-card-editor", TdsFlowCardEditor);
}

// Metadata for Home Assistant card picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: "tds-flow-card",
  name: "TDS & Flow Card",
  description: "Shows TDS in/out, temperatures and flow in a compact 3-column layout",
});
