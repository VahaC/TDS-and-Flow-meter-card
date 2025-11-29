// TDS-and-Flow-meter-card.js
// Home Assistant Lovelace custom card: TDS & Flow monitor

import { LitElement, html, css } from "https://unpkg.com/lit-element@2.5.1/lit-element.js?module";

// Simple helper to fire Home Assistant events (similar to fireEvent from custom-card-helpers)
const fireEvent = (node, type, detail = {}, options = {}) => {
  const event = new CustomEvent(type, {
    bubbles: options.bubbles ?? true,
    composed: options.composed ?? true,
    cancelable: options.cancelable ?? false,
    detail,
  });
  node.dispatchEvent(event);
  return event;
};

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
        margin-left: 2px;
      }

      .placeholder {
        opacity: 0.6;
        font-style: italic;
      }
    `;
  }

  setConfig(config) {
    if (!config || typeof config !== "object") {
      throw new Error("Invalid configuration for tds-flow-card");
    }

    // Flow is the core of the card, but we do not throw here,
    // to avoid red error when user just created the card via UI.
    this._config = {
      name: "TDS & Flow",
      ...config,
    };
  }

  getCardSize() {
    return 2;
  }

  static getStubConfig(hass, entities) {
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
              ${c.flow_entity
                ? html`${flow.value}${flow.unit
                    ? html`<span class="unit">${flow.unit}</span>`
                    : ""}`
                : html`<span class="placeholder">Select flow entity in editor</span>`}
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

  static getConfigElement() {
    return document.createElement("tds-flow-card-editor");
  }
}

/**
 * Editor based on standard Home Assistant components: ha-form + entity selectors.
 * This uses the same UX as built-in cards.
 */
class TdsFlowCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      _config: { attribute: false },
    };
  }

  setConfig(config) {
    this._config = config || {};
  }

  get _schema() {
    // Each field uses HA selector => internally it shows proper entity picker
    return [
      { name: "name", selector: { text: {} } },
      {
        name: "tds_in_entity",
        selector: { entity: { domain: "sensor" } },
      },
      {
        name: "tds_in_temp_entity",
        selector: { entity: { domain: "sensor" } },
      },
      {
        name: "flow_entity",
        selector: { entity: { domain: "sensor" } },
      },
      {
        name: "tds_out_entity",
        selector: { entity: { domain: "sensor" } },
      },
      {
        name: "tds_out_temp_entity",
        selector: { entity: { domain: "sensor" } },
      },
    ];
  }

  _computeLabel(schema) {
    switch (schema.name) {
      case "name":
        return "Name (optional)";
      case "tds_in_entity":
        return "TDS in sensor";
      case "tds_in_temp_entity":
        return "TDS in temperature sensor";
      case "flow_entity":
        return "Flow sensor (required)";
      case "tds_out_entity":
        return "TDS out sensor";
      case "tds_out_temp_entity":
        return "TDS out temperature sensor";
      default:
        return schema.name;
    }
  }

  _valueChanged(ev) {
    if (!this.hass) return;
    const newConfig = ev.detail.value;
    this._config = newConfig;
    fireEvent(this, "config-changed", { config: this._config });
  }

  render() {
    if (!this.hass) {
      return html``;
    }

    const data = {
      name: "TDS & Flow",
      tds_in_entity: "",
      tds_in_temp_entity: "",
      flow_entity: "",
      tds_out_entity: "",
      tds_out_temp_entity: "",
      ...(this._config || {}),
    };

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${this._schema}
        .computeLabel=${this._computeLabel.bind(this)}
        @value-changed=${this._valueChanged}
      ></ha-form>
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
