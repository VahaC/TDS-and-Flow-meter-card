// TDS-and-Flow-meter-card.js
// Home Assistant Lovelace custom card: TDS & Flow monitor
// with per-sensor icons, labels and tap behaviors

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

  static _helpers;

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
        align-items: center;
        gap: 4px;
      }

      .temp-in {
        grid-area: temp-in;
        font-size: 12px;
        opacity: 0.85;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: 4px;
      }

      .flow {
        grid-area: flow;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
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
        align-items: center;
        gap: 4px;
      }

      .temp-out {
        grid-area: temp-out;
        font-size: 12px;
        opacity: 0.85;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 4px;
      }

      .label {
        opacity: 0.8;
      }

      .value {
        font-weight: 600;
        cursor: pointer;
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

      /* Icon alignment tweaks */
      .icon,
      .icon-flow {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transform: translateY(-1px);
        cursor: pointer;
      }

      .icon {
        width: 16px;
        height: 16px;
      }

      .icon-flow {
        width: 20px;
        height: 20px;
      }
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    // Load card helpers once to use handleAction + actionHandler
    if (!TdsFlowCard._helpers && window.loadCardHelpers) {
      window.loadCardHelpers().then((helpers) => {
        TdsFlowCard._helpers = helpers;
        this.requestUpdate();
      });
    }
  }

  setConfig(config) {
    if (!config || typeof config !== "object") {
      throw new Error("Invalid configuration for tds-flow-card");
    }
    // Keep exactly what UI passed
    this._config = { ...config };
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

  // Use Home Assistant formatter so precision matches sensor settings
  _formatValue(stateObj, fallbackUnit) {
    if (!stateObj) {
      return { value: "–", unit: fallbackUnit || "" };
    }

    const state = stateObj.state;
    if (state === "unknown" || state === "unavailable") {
      return { value: "–", unit: fallbackUnit || "" };
    }

    const unit = stateObj.attributes?.unit_of_measurement || fallbackUnit || "";
    let display = state;

    try {
      if (this.hass && typeof this.hass.formatEntityState === "function") {
        display = this.hass.formatEntityState(stateObj);
        if (unit && display.endsWith(unit)) {
          const idx = display.lastIndexOf(unit);
          const valuePart = display.slice(0, idx).trim();
          return { value: valuePart, unit };
        }
        return { value: display, unit: "" };
      }
    } catch (_e) {
      // ignore and use fallbacks below
    }

    const precision = stateObj.attributes?.display_precision;
    const num = Number(state);
    if (typeof precision === "number" && Number.isFinite(num)) {
      return { value: num.toFixed(precision), unit };
    }

    return { value: state, unit };
  }

  _handleAction(ev, actionConfig, entityId) {
    const helpers = TdsFlowCard._helpers;
    if (!helpers || !this.hass || !entityId) return;

    const action = ev.detail?.action || "tap";
    const config = {
      entity: entityId,
      tap_action: actionConfig || { action: "more-info" },
    };

    helpers.handleAction(this, this.hass, config, action);
  }

  render() {
    if (!this._config || !this.hass) {
      return html``;
    }

    const hass = this.hass;
    const c = this._config;

    const getStateObj = (entityId) =>
      entityId && hass.states[entityId] ? hass.states[entityId] : undefined;

    const tdsIn = this._formatValue(getStateObj(c.tds_in_entity), "ppm");
    const tempIn = this._formatValue(getStateObj(c.tds_in_temp_entity), "°C");
    const flow = this._formatValue(getStateObj(c.flow_entity), "");
    const tdsOut = this._formatValue(getStateObj(c.tds_out_entity), "ppm");
    const tempOut = this._formatValue(getStateObj(c.tds_out_temp_entity), "°C");

    // Per-sensor icon visibility
    const showIconTdsIn = !!c.show_icon_tds_in;
    const showIconTdsInTemp = !!c.show_icon_tds_in_temp;
    const showIconFlow = !!c.show_icon_flow;
    const showIconTdsOut = !!c.show_icon_tds_out;
    const showIconTdsOutTemp = !!c.show_icon_tds_out_temp;

    // Icons with defaults
    const iconTdsIn = c.icon_tds_in || "mdi:water-opacity";
    const iconTdsInTemp = c.icon_tds_in_temp || "mdi:thermometer";
    const iconFlow = c.icon_flow || "mdi:water";
    const iconTdsOut = c.icon_tds_out || "mdi:water-opacity";
    const iconTdsOutTemp = c.icon_tds_out_temp || "mdi:thermometer";

    // Labels with defaults
    const labelTdsIn = c.label_tds_in || "TDS in";
    const labelTdsInTemp = c.label_tds_in_temp || "Temp in";
    const labelFlow = c.label_flow || "Flow";
    const labelTdsOut = c.label_tds_out || "TDS out";
    const labelTdsOutTemp = c.label_tds_out_temp || "Temp out";

    const helpers = TdsFlowCard._helpers;
    const actionHandler =
      helpers && helpers.actionHandler
        ? helpers.actionHandler({ hasHold: false, hasDoubleClick: false })
        : undefined;

    return html`
      <ha-card>
        ${c.name ? html`<div class="title">${c.name}</div>` : ""}
        <div class="container">
          <!-- Left column: TDS IN + temperature IN -->
          <div class="tds-in">
            ${showIconTdsIn
              ? html`<ha-icon
                  class="icon"
                  .icon=${iconTdsIn}
                  @action=${(ev) =>
                    this._handleAction(ev, c.tds_in_icon_tap_action, c.tds_in_entity)}
                  .actionHandler=${actionHandler}
                ></ha-icon>`
              : ""}
            <span class="label">${labelTdsIn}:</span>
            <span
              class="value"
              @action=${(ev) =>
                this._handleAction(ev, c.tds_in_tap_action, c.tds_in_entity)}
              .actionHandler=${actionHandler}
              >${tdsIn.value}</span
            >
            ${tdsIn.unit ? html`<span class="unit">${tdsIn.unit}</span>` : ""}
          </div>

          <div class="temp-in">
            ${showIconTdsInTemp
              ? html`<ha-icon
                  class="icon"
                  .icon=${iconTdsInTemp}
                  @action=${(ev) =>
                    this._handleAction(
                      ev,
                      c.tds_in_temp_icon_tap_action,
                      c.tds_in_temp_entity
                    )}
                  .actionHandler=${actionHandler}
                ></ha-icon>`
              : ""}
            <span class="label">${labelTdsInTemp}:</span>
            <span
              class="value"
              @action=${(ev) =>
                this._handleAction(
                  ev,
                  c.tds_in_temp_tap_action,
                  c.tds_in_temp_entity
                )}
              .actionHandler=${actionHandler}
              >${tempIn.value}</span
            >
            ${tempIn.unit ? html`<span class="unit">${tempIn.unit}</span>` : ""}
          </div>

          <!-- Center: FLOW -->
          <div class="flow">
            ${showIconFlow
              ? html`<ha-icon
                  class="icon-flow"
                  .icon=${iconFlow}
                  @action=${(ev) =>
                    this._handleAction(ev, c.flow_icon_tap_action, c.flow_entity)}
                  .actionHandler=${actionHandler}
                ></ha-icon>`
              : ""}
            <div class="flow-label">${labelFlow}</div>
            <div
              class="flow-value"
              @action=${(ev) =>
                this._handleAction(ev, c.flow_tap_action, c.flow_entity)}
              .actionHandler=${actionHandler}
            >
              ${c.flow_entity
                ? html`${flow.value}${flow.unit
                    ? html`<span class="unit">${flow.unit}</span>`
                    : ""}`
                : html`<span class="placeholder">Select flow entity in editor</span>`}
            </div>
          </div>

          <!-- Right column: TDS OUT + temperature OUT -->
          <div class="tds-out">
            ${showIconTdsOut
              ? html`<ha-icon
                  class="icon"
                  .icon=${iconTdsOut}
                  @action=${(ev) =>
                    this._handleAction(
                      ev,
                      c.tds_out_icon_tap_action,
                      c.tds_out_entity
                    )}
                  .actionHandler=${actionHandler}
                ></ha-icon>`
              : ""}
            <span class="label">${labelTdsOut}:</span>
            <span
              class="value"
              @action=${(ev) =>
                this._handleAction(ev, c.tds_out_tap_action, c.tds_out_entity)}
              .actionHandler=${actionHandler}
              >${tdsOut.value}</span
            >
            ${tdsOut.unit ? html`<span class="unit">${tdsOut.unit}</span>` : ""}
          </div>

          <div class="temp-out">
            ${showIconTdsOutTemp
              ? html`<ha-icon
                  class="icon"
                  .icon=${iconTdsOutTemp}
                  @action=${(ev) =>
                    this._handleAction(
                      ev,
                      c.tds_out_temp_icon_tap_action,
                      c.tds_out_temp_entity
                    )}
                  .actionHandler=${actionHandler}
                ></ha-icon>`
              : ""}
            <span class="label">${labelTdsOutTemp}:</span>
            <span
              class="value"
              @action=${(ev) =>
                this._handleAction(
                  ev,
                  c.tds_out_temp_tap_action,
                  c.tds_out_temp_entity
                )}
              .actionHandler=${actionHandler}
              >${tempOut.value}</span
            >
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
 * Editor with 3 collapsible groups (TDS in, Flow, TDS out),
 * based on ha-expansion-panel + ha-form + hui-action-editor.
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
        gap: 8px;
      }

      ha-expansion-panel {
        --ha-card-border-radius: 12px;
      }

      .group-body {
        padding: 8px 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .group-title {
        font-size: 13px;
        font-weight: 600;
      }

      ha-form {
        --ha-form-padding: 0;
      }
    `;
  }

  setConfig(config) {
    this._config = config || {};
  }

  // Base/card-level settings
  get _schemaBase() {
    return [{ name: "name", selector: { text: {} } }];
  }

  // TDS in: main sensor
  get _schemaTdsInMain() {
    return [
      { name: "tds_in_entity", selector: { entity: { domain: "sensor" } } },
      { name: "label_tds_in", selector: { text: {} } },
      { name: "show_icon_tds_in", selector: { boolean: {} } },
      { name: "icon_tds_in", selector: { icon: {} } },
    ];
  }

  // TDS in: temperature
  get _schemaTdsInTemp() {
    return [
      { name: "tds_in_temp_entity", selector: { entity: { domain: "sensor" } } },
      { name: "label_tds_in_temp", selector: { text: {} } },
      { name: "show_icon_tds_in_temp", selector: { boolean: {} } },
      { name: "icon_tds_in_temp", selector: { icon: {} } },
    ];
  }

  // Flow group
  get _schemaFlow() {
    return [
      { name: "flow_entity", selector: { entity: { domain: "sensor" } } },
      { name: "label_flow", selector: { text: {} } },
      { name: "show_icon_flow", selector: { boolean: {} } },
      { name: "icon_flow", selector: { icon: {} } },
    ];
  }

  // TDS out: main sensor
  get _schemaTdsOutMain() {
    return [
      { name: "tds_out_entity", selector: { entity: { domain: "sensor" } } },
      { name: "label_tds_out", selector: { text: {} } },
      { name: "show_icon_tds_out", selector: { boolean: {} } },
      { name: "icon_tds_out", selector: { icon: {} } },
    ];
  }

  // TDS out: temperature
  get _schemaTdsOutTemp() {
    return [
      { name: "tds_out_temp_entity", selector: { entity: { domain: "sensor" } } },
      { name: "label_tds_out_temp", selector: { text: {} } },
      { name: "show_icon_tds_out_temp", selector: { boolean: {} } },
      { name: "icon_tds_out_temp", selector: { icon: {} } },
    ];
  }

  _computeLabel(schema) {
    switch (schema.name) {
      case "name":
        return "Card title (optional)";

      case "tds_in_entity":
        return "TDS in sensor";
      case "label_tds_in":
        return "Label for TDS in (optional)";
      case "show_icon_tds_in":
        return "Show icon for TDS in";
      case "icon_tds_in":
        return "Icon for TDS in";

      case "tds_in_temp_entity":
        return "Temp in sensor";
      case "label_tds_in_temp":
        return "Label for Temp in (optional)";
      case "show_icon_tds_in_temp":
        return "Show icon for Temp in";
      case "icon_tds_in_temp":
        return "Icon for Temp in";

      case "flow_entity":
        return "Flow sensor";
      case "label_flow":
        return "Label for Flow (optional)";
      case "show_icon_flow":
        return "Show icon for Flow";
      case "icon_flow":
        return "Icon for Flow";

      case "tds_out_entity":
        return "TDS out sensor";
      case "label_tds_out":
        return "Label for TDS out (optional)";
      case "show_icon_tds_out":
        return "Show icon for TDS out";
      case "icon_tds_out":
        return "Icon for TDS out";

      case "tds_out_temp_entity":
        return "Temp out sensor";
      case "label_tds_out_temp":
        return "Label for Temp out (optional)";
      case "show_icon_tds_out_temp":
        return "Show icon for Temp out";
      case "icon_tds_out_temp":
        return "Icon for Temp out";

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

  _actionChanged(ev, key) {
    ev.stopPropagation();
    const value = ev.detail.value;
    const cfg = { ...(this._config || {}) };

    if (!value || value.action === "default") {
      delete cfg[key];
    } else {
      cfg[key] = value;
    }

    this._config = cfg;
    fireEvent(this, "config-changed", { config: this._config });
  }

  _renderActionEditors(data, tapKey, iconTapKey) {
    return html`
      <hui-action-editor
        .hass=${this.hass}
        .config=${data[tapKey]}
        .label=${"Tap behavior"}
        .actions=${["more-info", "navigate", "call-service", "url", "none"]}
        @value-changed=${(ev) => this._actionChanged(ev, tapKey)}
      ></hui-action-editor>
      <hui-action-editor
        .hass=${this.hass}
        .config=${data[iconTapKey]}
        .label=${"Icon tap behavior"}
        .actions=${["more-info", "navigate", "call-service", "url", "none"]}
        @value-changed=${(ev) => this._actionChanged(ev, iconTapKey)}
      ></hui-action-editor>
    `;
  }

  render() {
    if (!this.hass) {
      return html``;
    }

    const data = {
      ...(this._config || {}),
    };

    return html`
      <div class="card-config">
        <!-- Base/card-level settings -->
        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${this._schemaBase}
          .computeLabel=${this._computeLabel.bind(this)}
          @value-changed=${this._valueChanged}
        ></ha-form>

        <!-- TDS in group -->
        <ha-expansion-panel expanded>
          <div slot="header" class="group-title">TDS in</div>
          <div slot="content" class="group-body">
            <ha-form
              .hass=${this.hass}
              .data=${data}
              .schema=${this._schemaTdsInMain}
              .computeLabel=${this._computeLabel.bind(this)}
              @value-changed=${this._valueChanged}
            ></ha-form>
            ${this._renderActionEditors(
              data,
              "tds_in_tap_action",
              "tds_in_icon_tap_action"
            )}

            <ha-form
              .hass=${this.hass}
              .data=${data}
              .schema=${this._schemaTdsInTemp}
              .computeLabel=${this._computeLabel.bind(this)}
              @value-changed=${this._valueChanged}
            ></ha-form>
            ${this._renderActionEditors(
              data,
              "tds_in_temp_tap_action",
              "tds_in_temp_icon_tap_action"
            )}
          </div>
        </ha-expansion-panel>

        <!-- Flow group -->
        <ha-expansion-panel>
          <div slot="header" class="group-title">Flow</div>
          <div slot="content" class="group-body">
            <ha-form
              .hass=${this.hass}
              .data=${data}
              .schema=${this._schemaFlow}
              .computeLabel=${this._computeLabel.bind(this)}
              @value-changed=${this._valueChanged}
            ></ha-form>
            ${this._renderActionEditors(
              data,
              "flow_tap_action",
              "flow_icon_tap_action"
            )}
          </div>
        </ha-expansion-panel>

        <!-- TDS out group -->
        <ha-expansion-panel>
          <div slot="header" class="group-title">TDS out</div>
          <div slot="content" class="group-body">
            <ha-form
              .hass=${this.hass}
              .data=${data}
              .schema=${this._schemaTdsOutMain}
              .computeLabel=${this._computeLabel.bind(this)}
              @value-changed=${this._valueChanged}
            ></ha-form>
            ${this._renderActionEditors(
              data,
              "tds_out_tap_action",
              "tds_out_icon_tap_action"
            )}

            <ha-form
              .hass=${this.hass}
              .data=${data}
              .schema=${this._schemaTdsOutTemp}
              .computeLabel=${this._computeLabel.bind(this)}
              @value-changed=${this._valueChanged}
            ></ha-form>
            ${this._renderActionEditors(
              data,
              "tds_out_temp_tap_action",
              "tds_out_temp_icon_tap_action"
            )}
          </div>
        </ha-expansion-panel>
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
  description:
    "Shows TDS in/out, temperatures and flow in a compact 3-column layout with per-sensor icons, labels and tap behaviors",
});
