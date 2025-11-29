# TDS & Flow Meter Card

Custom Lovelace card for Home Assistant that presents TDS before/after a filter, temperatures, and water flow in a compact grid. The card is built with `lit-element`, ships with a visual config editor, and is ideal for reverse osmosis rigs, filtration systems, or any setup that tracks water quality sensors.

<img width="480" height="119" alt="image" src="https://github.com/user-attachments/assets/2883c225-4b2e-441b-ab9e-470578520df6" />

<img width="800" height="387" alt="image" src="https://github.com/user-attachments/assets/2c4287b0-6d96-4114-8e4d-7a3e3413cc07" />

## Features
- Three-column layout showing live TDS in/out, temperatures, and flow
- **Interactive:** Configure tap actions (more-info, navigate, url, service call) for every value and icon
- **Customizable:** Set custom labels and icons for each sensor
- Config validation ensures the card does not render without the primary flow sensor
- Built-in UI editor with entity pickers and labels for every field
- Graceful placeholders for `unknown`/`unavailable` states
- Smart stub config that preselects sensors when the card is added via “Add Card”

## Requirements
- Home Assistant 2023.4+ with Lovelace resources enabled
- Flow sensor (mandatory) plus optional TDS and temperature sensors
- HACS (recommended) or the ability to host custom static resources under `www`

## Installation

### Via HACS (recommended)
1. In HACS open **Frontend → Custom repositories** and add `https://github.com/VahaC/TDS-and-Flow-meter-card` as type *Dashboard*.
2. Locate “TDS & Flow Meter Card” in the list and click **Download**.
3. Reload Lovelace resources or restart Home Assistant after installation.

### Manual installation
1. Copy `TDS-and-Flow-meter-card.js` into `config/www/custom-lovelace/tds-flow-card/` (any path under `www` works).
2. Register the resource under `Configuration → Dashboards → Resources`:
	- **URL**: `/local/custom-lovelace/tds-flow-card/TDS-and-Flow-meter-card.js`
	- **Resource type**: `JavaScript Module`
3. Refresh the Lovelace dashboard page.

## Usage
Add the card through “Add Card → Custom: TDS & Flow Card” or paste YAML in the **Code editor** tab:

```yaml
type: custom:tds-flow-card
name: Reverse Osmosis
tds_in_entity: sensor.ro_tds_in
tds_in_temp_entity: sensor.ro_temp_in
flow_entity: sensor.ro_flow_rate
tds_out_entity: sensor.ro_tds_out
tds_out_temp_entity: sensor.ro_temp_out
```

## Configuration
| Option | Required | Default | Description |
| --- | --- | --- | --- |
| `name` | no | `"TDS & Flow"` | Card title shown above the grid |
| `flow_entity` | yes | – | Flow sensor entity; the card refuses to render without it |
| `tds_in_entity` | no | – | TDS sensor before the filter |
| `tds_in_temp_entity` | no | – | Temperature sensor before the filter |
| `tds_out_entity` | no | – | TDS sensor after the filter |
| `tds_out_temp_entity` | no | – | Temperature sensor after the filter |

### Per-sensor options
For each of the sensors above (replace `*` with `tds_in`, `tds_in_temp`, `flow`, `tds_out`, or `tds_out_temp`), you can configure:

| Option | Description |
| --- | --- |
| `label_*` | Custom label text (e.g. `label_tds_in`) |
| `show_icon_*` | Toggle icon visibility (boolean) |
| `icon_*` | Custom icon (e.g. `mdi:water`) |
| `*_tap_action` | Action when clicking the value (more-info, navigate, url, call-service, none) |
| `*_icon_tap_action` | Action when clicking the icon |

Unavailable values appear as em dashes, and units are taken from Home Assistant attributes or fall back to sensible defaults (`ppm` for TDS, `°C` for temperature).

## Development tips
- Main source file: `TDS-and-Flow-meter-card.js`
- Built on `lit-element@2.5.1`; for local tweaks you can serve the file via `python3 -m http.server` and add the resource from `http://<dev-host>:<port>/TDS-and-Flow-meter-card.js`
- Reloading the Lovelace view is enough to pick up changes; the script auto-registers `tds-flow-card` and `tds-flow-card-editor`

## License
Distributed under the MIT License (see `LICENSE`).
