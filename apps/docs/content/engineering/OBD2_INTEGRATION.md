# OBD2 Integration — Technical Reference & MVP Plan

**Last updated:** 2026-02-22
**Status:** Research / Pre-development
**Method committed:** Dual-mode — WiFi auto-sync at home garage + ELM327 live mode via companion app ($0 recurring)

---

## Table of Contents

1. [Strategy Overview](#strategy-overview)
2. [Dual-Mode Architecture](#dual-mode-architecture)
3. [Hardware Reference](#hardware-reference)
4. [OBD2 Protocol & PID Reference](#obd2-protocol--pid-reference)
5. [WiFi Sync Architecture](#wifi-sync-architecture)
6. [Power Management](#power-management)
7. [Flash Wear & Data Buffering](#flash-wear--data-buffering)
8. [Supabase Ingest Pipeline](#supabase-ingest-pipeline)
9. [Open-Source Firmware & Libraries](#open-source-firmware--libraries)
10. [MVP Rollout Plan](#mvp-rollout-plan)
11. [WiCAN Reference (Off-the-Shelf Benchmark)](#wican-reference)
12. [Competitor Landscape](#competitor-landscape)
13. [DDPC Connect — Companion App Revenue Play](#ddpc-connect--companion-app-revenue-play)
14. [Torque / Torque Pro Acquisition Analysis](#torque--torque-pro-acquisition-analysis)

---

## Strategy Overview

DDPC needs real-time vehicle telemetry (RPM, coolant temp, speed, fuel level, DTCs) to feed into the platform's maintenance tracking, health score, and predictive service features. The approach is a **dual-mode ESP32 OBD2 device** that operates in two complementary modes:

1. **Background mode (WiFi dump):** Device plugs into the OBD-II port, silently polls PIDs while driving, buffers to flash, and auto-syncs to Supabase over home WiFi when the car parks in the garage. Zero user interaction after initial setup. $0 recurring.
2. **Live mode (ELM327):** When a phone connects via BLE or local WiFi, the device switches to ELM327 command mode. The DDPC companion app (or any ELM327-compatible app like Torque, Car Scanner, etc.) gets live gauges, DTC reading/clearing, and real-time data — while still logging everything to the buffer for later sync.

**Why this dual approach:**

- WiFi dump = unattended data collection (set and forget, feeds DDPC automatically)
- ELM327 live = active engagement (user opens app, sees live data, clears codes)
- Same hardware, same data pipeline, two use cases
- ELM327 compatibility means the device works with the entire existing OBD2 app ecosystem on day one
- The companion app ("DDPC Connect") is both a Torque killer and a standalone revenue play (see [Companion App Revenue Play](#ddpc-connect--companion-app-revenue-play))

**Why WiFi-only for background sync (not BLE or cellular):**

- BLE requires a phone app as a bridge, adds UX friction, drains phone battery, and requires the phone to be in the car with the app running
- Cellular adds $8-15/mo per device (or $2-5/mo DIY with prepaid SIM), which kills unit economics for a free test device program
- WiFi-only: $0 recurring, no phone needed, automatic sync when car is home, simplest UX

**Rollout plan:** Build for Rory's car first, then manufacture 3-5 units for power users (free of charge) to collect test data from diverse vehicles, then productize.

---

## Dual-Mode Architecture

The device runs a single firmware with two operating modes, switchable at runtime. This is proven architecture — WiCAN Pro already does exactly this (background MQTT logging + ELM327 app compatibility).

### Mode 1: Background (WiFi Auto-Sync)

```
Engine start → ESP32 wakes → Polls OBD2 PIDs at 1Hz → Buffers to LittleFS
Engine stop  → Detects voltage drop → Connects to home WiFi → Uploads to Supabase
           → No WiFi? Keeps buffer, retries next cycle → Deep sleep (~50μA)
```

- No phone required. No user interaction after initial WiFi setup.
- Data appears in DDPC dashboard automatically.
- Primary use: odometer tracking, fuel log automation, trip history, health score updates, DTC monitoring.

### Mode 2: Live (ELM327 Compatible)

```
User opens DDPC Connect app → App scans for device via BLE or local WiFi
→ Device enters ELM327 command mode → Responds to AT commands
→ App displays live gauges, DTCs, sensor data
→ All data ALSO buffered to flash for later WiFi sync (dual-write)
```

- ELM327 is a text-based serial protocol (~50 AT commands total, most apps use ~15).
- Compatible with Torque Pro, Car Scanner, OBD Fusion, and any ELM327 app out of the box.
- DDPC Connect app adds tight platform integration (auto-link to vehicle, push DTCs to issue reports, etc.).
- Primary use: live diagnostics, DTC clearing, real-time monitoring during drives.

### Mode Switching Logic

```
IF (BLE or WiFi client connects AND sends "ATZ" or "ATE0")
  → Enter ELM327 mode
  → Continue background buffering in parallel (dual-write)

IF (BLE/WiFi client disconnects OR no client for 60 seconds)
  → Return to background-only mode

IF (engine off detected via voltage)
  → Finish any active ELM327 session
  → Flush buffer
  → Attempt WiFi sync
  → Deep sleep
```

### ELM327 Command Subset (MVP)

The full ELM327 spec has ~80 commands. For MVP, implement the ~15 that 95% of apps actually use:

| Command | Response | Purpose |
|---------|----------|---------|
| `ATZ` | `ELM327 v2.1` | Reset, identify as ELM327 |
| `ATE0` / `ATE1` | `OK` | Echo off/on |
| `ATL0` / `ATL1` | `OK` | Linefeeds off/on |
| `ATS0` / `ATS1` | `OK` | Spaces off/on |
| `ATH0` / `ATH1` | `OK` | Headers off/on |
| `ATSP0` - `ATSP9` | `OK` | Set protocol (auto = 0) |
| `ATDP` | `AUTO, ISO 15765-4 (CAN 11/500)` | Describe protocol |
| `ATRV` | `12.6V` | Read voltage |
| `ATDPN` | `A6` | Describe protocol number |
| `01 00` | `41 00 BE 3E B8 13` | Supported PIDs bitmap |
| `01 XX` | `41 XX [data]` | Mode 01 PID request |
| `03` | `43 [DTC data]` | Read DTCs |
| `04` | `44` | Clear DTCs |
| `09 02` | `49 02 [VIN]` | Read VIN |

The device translates these AT commands into native CAN frames via TWAI/MCP2515, then formats the CAN response back into ELM327 text format. Libraries like ELMduino's source code document the exact response formats.

### Why Dual-Mode Wins

| | WiFi Dump Only | ELM327 Only | Dual-Mode |
|---|---|---|---|
| Unattended data collection | Yes | No | Yes |
| Live gauges in app | No | Yes | Yes |
| Works with existing OBD apps | No | Yes | Yes |
| DDPC platform integration | Yes (delayed) | Yes (real-time) | Yes (both) |
| User engagement | Low (invisible) | High (active use) | Both |
| Revenue potential | Hardware only | App + hardware | App + hardware + subscription |

---

## Hardware Reference

### DIY BOM (Target: $12-20 per unit)

| Component | Part | Est. Cost | Notes |
|-----------|------|-----------|-------|
| MCU | ESP32-S3 DevKit (N16R8) | $5-8 | Dual-core 240MHz, WiFi + BLE, 16MB flash, 8MB PSRAM |
| CAN Controller | MCP2515 module | $2-3 | SPI-connected, CAN 2.0A/B, 1Mbps max |
| CAN Transceiver | SN65HVD230 or TJA1050 | $1-2 | 3.3V logic level compatible with ESP32 |
| OBD Connector | J1962 male (16-pin) | $2-3 | Standard OBD-II port connector |
| Voltage Regulator | AMS1117-3.3 or LM2596 | $0.50-1 | 12V→3.3V for ESP32 power from OBD port |
| Misc | PCB, capacitors, wiring | $2-3 | Decoupling caps on CAN bus, pull-ups |
| **Total** | | **$12-20** | |

**Alternative MCU option:** ESP32-C3 ($3-5) — single-core RISC-V, lower power, cheaper. Sufficient for OBD2 polling. WiCAN standard uses this. Trade-off: less processing headroom for on-device analytics.

**Alternative approach:** Skip MCP2515 and use ESP32-S3's built-in TWAI (Two-Wire Automotive Interface) controller. Only need the SN65HVD230 transceiver. Reduces BOM by $2-3 and simplifies firmware. TWAI supports CAN 2.0A/B natively.

### Pin Connections (ESP32-S3 + MCP2515)

```
ESP32-S3          MCP2515
--------          -------
GPIO10 (MOSI) --> SI
GPIO11 (MISO) <-- SO
GPIO12 (SCK)  --> SCK
GPIO13 (CS)   --> CS
GPIO14        <-- INT
3.3V          --> VCC
GND           --> GND

MCP2515           SN65HVD230
-------           ----------
CANH          --> CANH  --> OBD pin 6
CANL          --> CANL  --> OBD pin 14
```

### Pin Connections (ESP32-S3 TWAI — no MCP2515)

```
ESP32-S3          SN65HVD230
--------          ----------
GPIO4 (TX)    --> D (Driver Input)
GPIO5 (RX)    <-- R (Receiver Output)
3.3V          --> VCC, Rs (pull to GND for high-speed mode or 3.3V for slope control)
GND           --> GND

SN65HVD230        OBD-II Port
----------        ----------
CANH          --> Pin 6
CANL          --> Pin 14
```

### OBD-II Port Pinout (J1962)

| Pin | Signal | Notes |
|-----|--------|-------|
| 2 | J1850 Bus+ | GM/Chrysler (legacy) |
| 4 | Chassis GND | |
| 5 | Signal GND | |
| 6 | CAN High | ISO 15765 (most 2008+ vehicles) |
| 7 | K-Line | ISO 9141/14230 (older vehicles) |
| 10 | J1850 Bus- | Ford (legacy) |
| 14 | CAN Low | ISO 15765 |
| 15 | L-Line | ISO 9141 init (rare) |
| 16 | Battery +12V | Always-on power (fused) |

**Important:** Pin 16 provides constant 12V even when the engine is off. Power management is critical to avoid draining the battery.

---

## OBD2 Protocol & PID Reference

### Supported Protocols

| Protocol | Pins | Era | Prevalence |
|----------|------|-----|------------|
| ISO 15765 (CAN) | 6, 14 | 2008+ US mandate | ~95% of vehicles on road today |
| ISO 14230 (KWP2000) | 7 | 2003-2010 | European vehicles |
| ISO 9141-2 | 7, 15 | 1996-2004 | Older European/Asian |
| SAE J1850 PWM | 2, 10 | 1996-2007 | Ford |
| SAE J1850 VPW | 2 | 1996-2007 | GM/Chrysler |

**For MVP:** CAN-only (ISO 15765) covers the vast majority of 2008+ vehicles. The ESP32+MCP2515 or ESP32 TWAI approach handles CAN natively. Older protocols require additional hardware (K-Line transceiver like L9637D).

### Key PIDs for DDPC Platform

#### Mode 01 — Real-Time Data

| PID | Hex | Bytes | Formula | Unit | DDPC Use |
|-----|-----|-------|---------|------|----------|
| Engine RPM | 0x0C | 2 | ((A×256)+B)/4 | rpm | Health monitoring, idle detection |
| Vehicle Speed | 0x0D | 1 | A | km/h | Trip tracking, odometer calculation |
| Coolant Temp | 0x05 | 1 | A-40 | °C | Health score, overheating alerts |
| Intake Air Temp | 0x0F | 1 | A-40 | °C | Performance monitoring |
| Engine Load | 0x04 | 1 | A/2.55 | % | Driving behavior analysis |
| Fuel Level | 0x2F | 1 | A/2.55 | % | Fuel log automation |
| Throttle Position | 0x11 | 1 | A/2.55 | % | Driving behavior |
| Run Time | 0x1F | 2 | (A×256)+B | sec | Trip duration |
| Fuel System Status | 0x03 | 2 | Bitmask | — | Diagnostics |
| Battery Voltage | 0x42 | 2 | ((A×256)+B)/1000 | V | Battery health |
| Odometer | 0xA6 | 4 | (A<<24+B<<16+C<<8+D)/10 | km | **NOT universally supported** |

#### Mode 03 — Diagnostic Trouble Codes (DTCs)

Returns active DTCs. Format: 2 bytes per code.

```
First byte high nibble = system:
  0 = Powertrain (P0xxx)
  1 = Powertrain (P1xxx — manufacturer-specific)
  2 = Powertrain (P2xxx)
  3 = Powertrain (P3xxx — manufacturer-specific)
  4 = Chassis (C0xxx)
  8 = Body (B0xxx)
  C = Network (U0xxx)
```

**DDPC integration:** Auto-populate issue reports with DTCs, link to known fixes in community database.

#### Mode 09 — Vehicle Information

| PID | Description | Notes |
|-----|-------------|-------|
| 0x02 | VIN | 17-char ASCII, returned in multi-frame message |
| 0x04 | Calibration ID | ECU software version |
| 0x0A | ECU Name | |

### Odometer Calculation (Since PID 0xA6 is unreliable)

Calculate from speed × time integration:

```
distance_km += (speed_kmh / 3600) * sample_interval_seconds
```

At 1Hz sampling: 1 sample/sec × 3600 sec/hr = 3600 samples/hr. Error margin ~1-3% vs GPS-based odometer. Store cumulative distance per trip, add to last known odometer reading from DDPC.

### Polling Strategy

```
Priority 1 (1 Hz):  RPM, Speed, Coolant Temp, Fuel Level
Priority 2 (0.2 Hz): Engine Load, Throttle, Battery Voltage
Priority 3 (on-start): VIN, DTCs, Calibration ID
Priority 4 (on-stop): Trip summary (distance, duration, avg speed, fuel used)
```

**CAN bus bandwidth:** OBD2 standard baud rate is 500kbps. Each request/response is ~8-16 bytes. At 1Hz polling of 4 PIDs, bus utilization is negligible (<0.01%). Safe to poll without interfering with ECU communications.

---

## WiFi Sync Architecture

### Connection Flow

```
[Engine Start] → ESP32 wakes → Polls OBD2 PIDs → Buffers to LittleFS
                                                        |
[Engine Stop]  → ESP32 detects voltage drop             |
               → Attempts WiFi connection               |
               → If home network found:                 |
                   → Uploads buffered data to Supabase  ←
                   → Clears local buffer
                   → Enters deep sleep
               → If no WiFi:
                   → Keeps buffer on flash
                   → Enters deep sleep
                   → Retries next engine stop
```

### WiFi Configuration

- SSID/password stored in NVS (Non-Volatile Storage) on ESP32
- Initial setup via BLE provisioning or AP mode (ESP32 creates a hotspot, user connects and enters WiFi creds via captive portal)
- Support multiple SSIDs (home, work, etc.) with priority ordering
- Fallback: if no known network found after 30 seconds, sleep and retry next cycle

### Data Format (JSON for Supabase ingest)

```json
{
  "device_id": "ddpc-obd-001",
  "vehicle_id": "uuid-from-ddpc",
  "trip": {
    "start_time": "2026-02-22T08:30:00Z",
    "end_time": "2026-02-22T09:15:00Z",
    "distance_km": 42.3,
    "duration_seconds": 2700,
    "avg_speed_kmh": 56.4,
    "max_speed_kmh": 112,
    "fuel_used_pct": 8.2,
    "start_fuel_pct": 72.0,
    "end_fuel_pct": 63.8
  },
  "snapshots": [
    {
      "timestamp": "2026-02-22T08:30:01Z",
      "rpm": 850,
      "speed_kmh": 0,
      "coolant_temp_c": 45,
      "fuel_level_pct": 72.0,
      "battery_v": 14.2
    }
  ],
  "dtcs": ["P0301", "P0420"],
  "vin": "1HGCM82633A004352"
}
```

**Optimization:** Don't send every 1Hz snapshot. Aggregate trip-level stats and send only 1-minute or 5-minute averaged snapshots to reduce payload size. Full 1Hz data stays on device for 24 hours, then gets downsampled.

### Buffer Capacity

- ESP32-S3 with 16MB flash: ~12MB usable for LittleFS after firmware
- Each 1Hz snapshot: ~100 bytes JSON (compressed ~50 bytes)
- 1 hour of driving at 1Hz = 3,600 snapshots × 50 bytes = ~180KB
- **~66 hours of buffering capacity** before flash is full
- With 5-minute aggregation for upload: ~20 bytes per interval, virtually unlimited

---

## Power Management

### The Problem

OBD-II pin 16 provides constant 12V power. An ESP32 in active mode draws 80-240mA. Over days/weeks of parking, this can drain a car battery (typical: 40-60Ah).

### Solution: Voltage-Based State Machine

```
State: ACTIVE (engine running)
  - Battery voltage > 13.2V (alternator charging)
  - Poll OBD2 PIDs at configured rate
  - Buffer data to LittleFS
  - Current draw: ~80-150mA

State: SYNC (engine just stopped)
  - Battery voltage drops below 13.0V
  - Wait 5 seconds to confirm engine off (not just idle dip)
  - Calculate trip summary
  - Attempt WiFi connection (30 sec timeout)
  - Upload data if connected
  - Current draw: ~150-240mA for ~30-60 seconds

State: DEEP_SLEEP (parked)
  - WiFi off, CAN off, CPU halted
  - Wake on timer (every 6 hours) to retry WiFi sync if buffer has unsent data
  - Current draw: ~10-50 μA
  - At 50μA: 0.05mA × 24h = 1.2mAh/day → negligible battery drain
```

### Voltage Thresholds

| Voltage | Interpretation |
|---------|---------------|
| > 13.8V | Engine running, alternator charging |
| 13.0-13.8V | Engine idle or accessories on |
| 12.4-13.0V | Engine off, battery resting (healthy) |
| 11.8-12.4V | Engine off, battery partially discharged |
| < 11.8V | Low battery warning — disable device |

**Safety cutoff:** If battery voltage reads below 11.8V at any wake, the device should disable itself entirely and not attempt to wake again until it detects >13.0V (engine started). This prevents the OBD adapter from being the thing that kills the battery.

### Hardware for Voltage Monitoring

Use a voltage divider (e.g., 100kΩ + 33kΩ) to scale 12V down to ESP32's 3.3V ADC range. Read on ADC1 channel (GPIO1-10 on ESP32-S3). Calibrate in firmware against a known multimeter reading.

---

## Flash Wear & Data Buffering

### LittleFS Wear Leveling

LittleFS handles wear leveling automatically. ESP32-S3 NOR flash is rated for ~100,000 erase cycles per sector. With LittleFS's wear leveling across 12MB:

- Writing 180KB/hour (1Hz full snapshots)
- Each 4KB sector gets erased every ~267 hours of driving (12MB / 180KB × 4KB)
- At 100,000 cycles: 100,000 × 267 hours = 26.7 million hours of driving
- **Flash wear is not a practical concern**

### Write Coalescing

To further reduce writes:

1. Buffer PID readings in RAM (ESP32-S3 has 512KB SRAM + 8MB PSRAM)
2. Write to flash every 60 seconds (batch of 60 readings = one write operation)
3. On engine-off detection, flush RAM buffer to flash immediately
4. On successful WiFi upload, delete the uploaded file from flash

### File Structure on Flash

```
/data/
  /trips/
    2026-02-22T083000.json    # One file per trip
    2026-02-22T171500.json
  /pending/                    # Not yet uploaded
    2026-02-21T083000.json
  /config/
    wifi.json                  # SSID/passwords
    device.json                # device_id, vehicle_id, polling config
```

---

## Supabase Ingest Pipeline

### Database Schema

```sql
-- Trip-level aggregates (primary table for DDPC features)
CREATE TABLE obd_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES user_vehicle(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  distance_km NUMERIC(10,2),
  duration_seconds INTEGER,
  avg_speed_kmh NUMERIC(6,2),
  max_speed_kmh NUMERIC(6,2),
  avg_rpm NUMERIC(8,2),
  max_rpm NUMERIC(8,2),
  avg_coolant_temp_c NUMERIC(5,1),
  max_coolant_temp_c NUMERIC(5,1),
  fuel_used_pct NUMERIC(5,2),
  start_fuel_pct NUMERIC(5,2),
  end_fuel_pct NUMERIC(5,2),
  start_battery_v NUMERIC(4,2),
  end_battery_v NUMERIC(4,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Raw snapshots (5-min aggregates, for detailed analysis)
CREATE TABLE obd_snapshots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  trip_id UUID REFERENCES obd_trips(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  rpm SMALLINT,
  speed_kmh SMALLINT,
  coolant_temp_c SMALLINT,
  fuel_level_pct NUMERIC(5,2),
  engine_load_pct NUMERIC(5,2),
  battery_v NUMERIC(4,2),
  throttle_pct NUMERIC(5,2)
);

-- DTCs captured per trip
CREATE TABLE obd_dtcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES user_vehicle(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES obd_trips(id) ON DELETE SET NULL,
  code TEXT NOT NULL,           -- e.g., "P0301"
  first_seen TIMESTAMPTZ NOT NULL,
  last_seen TIMESTAMPTZ,
  cleared_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- active, cleared, resolved
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Device registry
CREATE TABLE obd_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  vehicle_id UUID REFERENCES user_vehicle(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  firmware_version TEXT,
  hardware_version TEXT,
  last_seen TIMESTAMPTZ,
  last_sync TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_obd_trips_vehicle ON obd_trips(vehicle_id, start_time DESC);
CREATE INDEX idx_obd_snapshots_trip ON obd_snapshots(trip_id, timestamp);
CREATE INDEX idx_obd_dtcs_vehicle ON obd_dtcs(vehicle_id, status);
CREATE INDEX idx_obd_devices_vehicle ON obd_devices(vehicle_id);
```

### Ingest Edge Function

The ESP32 POSTs to a Supabase Edge Function with a device API key (not a user JWT — devices don't have user sessions).

```
POST /functions/v1/obd-ingest
Authorization: Bearer <device_api_key>
Content-Type: application/json

Body: { device_id, trip, snapshots, dtcs, vin }
```

The Edge Function:
1. Validates device_api_key against `obd_devices` table
2. Looks up `vehicle_id` from device registration
3. Inserts trip record into `obd_trips`
4. Batch-inserts snapshots into `obd_snapshots`
5. Upserts DTCs (update `last_seen` if code already active, insert if new)
6. Updates `obd_devices.last_sync`
7. Optionally triggers odometer update on `user_vehicle` if distance data is present
8. Returns `{ success: true, trip_id }` so the device can mark the data as uploaded

### DDPC Platform Integration Points

| Feature | OBD Data Used |
|---------|---------------|
| Odometer auto-update | Trip distance_km added to last known reading |
| Fuel log automation | start_fuel_pct, end_fuel_pct → calculate consumption |
| Health score (recency) | last trip timestamp feeds "days since last activity" |
| Health score (maintenance) | Coolant temp trends, DTC presence → service reminders |
| Issue reports | Auto-create issues from new DTCs with code descriptions |
| Trip history | New timeline entry type for trips |
| Driving stats | Avg speed, RPM distribution, trip frequency |

---

## Open-Source Firmware & Libraries

### Complete Projects (Ready to Fork/Study)

| Project | MCU | CAN Interface | Protocol | License | Notes |
|---------|-----|---------------|----------|---------|-------|
| [WiCAN firmware](https://github.com/meatpiHQ/wican-fw) | ESP32-C3/S3 | Built-in TWAI | CAN, OBD2 | GPL-3.0 | Production firmware for WiCAN hardware. MQTT, REST, WiFi AP setup. Best reference implementation. |
| [ESP32-MCP2515-OBD2-CANBUS](https://github.com/meatpiHQ/ESP32-MCP2515-OBD2-CANBUS) | ESP32 | MCP2515 | CAN, OBD2 | — | From WiCAN's creator. Good starting point for MCP2515-based builds. |
| [esp32_obd2](https://github.com/limiter121/esp32-obd2) | ESP32 | MCP2515 | OBD2 | MIT | Simple OBD2 PID reader. Good for learning. |

### Libraries (Arduino/PlatformIO)

| Library | Purpose | Notes |
|---------|---------|-------|
| [ELMduino](https://github.com/PowerBroker2/ELMduino) | ELM327-compatible OBD2 | Works over Serial, WiFi, BLE. Well-documented, active. |
| [esp32_can](https://github.com/collin80/esp32_can) | ESP32 TWAI driver | Low-level CAN driver using ESP32's built-in controller. |
| [mcp_can](https://github.com/coryjfowler/MCP_CAN_lib) | MCP2515 Arduino driver | Mature, well-tested. SPI-based CAN interface. |
| [isotp](https://github.com/lishen2/isotp-c) | ISO-TP (ISO 15765-2) | Multi-frame CAN message handling (needed for VIN, DTCs). |

### Development Environment

- **PlatformIO** (recommended over Arduino IDE) — proper dependency management, multiple board support, CI/CD friendly
- **ESP-IDF** (advanced) — Espressif's native SDK, more control but steeper learning curve
- **Arduino framework on PlatformIO** — best balance of simplicity and tooling

### Firmware Architecture (Recommended)

```
src/
  main.cpp              # Setup, state machine, loop
  obd/
    obd_reader.h/cpp    # PID request/response handling
    pid_definitions.h   # PID hex codes, formulas, names
    dtc_parser.h/cpp    # DTC code extraction and formatting
  can/
    can_driver.h/cpp    # MCP2515 or TWAI abstraction
  storage/
    trip_buffer.h/cpp   # LittleFS read/write, file management
    config_store.h/cpp  # WiFi creds, device config in NVS
  network/
    wifi_manager.h/cpp  # Connection, multi-SSID, retry logic
    api_client.h/cpp    # HTTPS POST to Supabase Edge Function
  power/
    power_manager.h/cpp # Voltage monitoring, sleep states
  provisioning/
    ble_setup.h/cpp     # Initial WiFi config via BLE (optional)
    ap_setup.h/cpp      # Captive portal for WiFi config
```

---

## MVP Rollout Plan

### Phase 1: Rory's Car (Weeks 1-4)

**Goal:** Proof of concept. Get one device reading OBD2 data and syncing to DDPC.

**Hardware:**
- 1x ESP32-S3 DevKit
- 1x MCP2515 module (or use TWAI with SN65HVD230 only)
- 1x SN65HVD230 CAN transceiver
- 1x OBD-II J1962 male connector with pigtail
- 1x AMS1117-3.3 voltage regulator
- Breadboard/perfboard for prototyping
- 3D printed enclosure (optional, can be bare board in a project box)

**Software milestones:**
1. Basic CAN read — verify communication with car's ECU
2. PID polling — read RPM, speed, coolant temp, fuel level
3. LittleFS buffering — store readings to flash
4. WiFi sync — connect to home network, POST to test endpoint
5. Supabase ingest — Edge Function receives and stores data
6. DDPC integration — trip data appears in vehicle dashboard
7. Power management — deep sleep when engine off, voltage cutoff

**Success criteria:** Device automatically reads data while driving, syncs when parked at home, and data appears in DDPC dashboard within minutes of parking.

### Phase 2: Power User Test Units (Weeks 5-8)

**Goal:** Validate across 3-5 different vehicles. Identify protocol edge cases, hardware reliability.

**Hardware:**
- 3-5 additional units (same BOM as Phase 1, but on custom PCB)
- Consider ordering WiCAN units ($40 each) as comparison/fallback
- Ship free to selected DDPC power users

**Software additions:**
- OTA firmware updates (ESP32 supports this natively via HTTPS)
- Remote config updates (polling config, WiFi creds, etc.)
- Error reporting (device health telemetry back to DDPC)
- Multi-vehicle protocol handling (if test vehicles use different CAN configs)

**Data collection targets:**
- Vehicle compatibility matrix (which PIDs each vehicle supports)
- WiFi sync reliability stats (success rate, retry counts)
- Power consumption measurements (battery voltage over multi-day parking)
- Flash wear metrics (write cycle counts)

**Success criteria:** 80%+ of test vehicles successfully auto-sync data with no user intervention after initial WiFi setup.

### Phase 3: Production (Weeks 9+)

**Goal:** Productize. Determine whether to manufacture DDPC-branded units or partner with WiCAN/similar.

**Decision points:**
- Build vs buy: Custom PCB ($5-8 per unit at 100+ quantity) vs WiCAN OEM
- Enclosure: Injection molded ($2-3k tooling) vs 3D printed
- Certification: FCC/CE required for selling consumer electronics with WiFi/BLE
- Pricing: Hardware cost + margin, or bundle with DDPC subscription tier
- Distribution: Direct sale, or included with Vanguard tier subscription

**Platform features unlocked by OBD data:**
- Automatic trip logging in timeline
- Predictive maintenance alerts based on sensor trends
- DTC-to-issue-report automation
- Real-time health score updates
- Fuel economy tracking without manual log entries
- Driving pattern analysis (for insurance discount partnerships, long-term)

---

## WiCAN Reference

WiCAN is an open-source, production-ready ESP32 OBD2 adapter from MeatPi Electronics. It serves as the primary benchmark for our DIY build.

### WiCAN Standard (~$40)

| Spec | Value |
|------|-------|
| MCU | ESP32-C3 (single-core RISC-V, 160MHz) |
| CAN | CAN 2.0A/B only (via built-in TWAI) |
| Connectivity | WiFi + BLE |
| Protocols | CAN bus direct (NOT ELM327 compatible) |
| Power | 12V from OBD-II port |
| Firmware | Open-source (GPL-3.0) |
| Features | MQTT, REST API, Home Assistant integration, WiFi AP provisioning |
| Form Factor | Small PCB, plugs directly into OBD-II port |
| Limitations | CAN only — won't work with older J1850/K-Line vehicles |

### WiCAN Pro (~$90-127)

| Spec | Value |
|------|-------|
| MCU | ESP32-S3 (dual-core Xtensa, 240MHz) |
| OBD Chip | Dedicated OBD-II protocol chip (handles all 5 protocols) |
| CAN | CAN 2.0A/B + CAN FD |
| Connectivity | WiFi + BLE |
| Protocol Compat | ELM327, ELM329, STN, VT compatible |
| Power | 12V from OBD-II port with sleep mode |
| Firmware | Open-source (GPL-3.0) |
| Features | Everything in standard + full ELM327 command set, CAN FD, multi-protocol |
| App Compat | Works with Torque, Car Scanner, OBD Fusion, etc. |

### WiCAN vs DIY Decision

| Factor | WiCAN Pro | DIY ESP32 |
|--------|-----------|-----------|
| Unit cost | $90-127 | $12-20 |
| Dev time | 0 (ready to use) | 40-80 hours |
| Protocol support | All 5 OBD-II protocols | CAN only (with MCP2515/TWAI) |
| Firmware | Maintained open-source | Custom, must maintain |
| App compatibility | Torque, Car Scanner, etc. | Custom DDPC integration only |
| OTA updates | Built-in | Must implement |
| Risk | Low (proven hardware) | Medium (custom electronics) |
| Customization | Fork firmware (GPL) | Full control |
| At scale (100 units) | $9,000-12,700 | $1,200-2,000 |

**Recommendation:** Use WiCAN Pro for Phase 1 (Rory's car) to validate the concept quickly, while developing custom firmware. For Phase 2 power user units, use WiCAN standard ($40 each) or custom PCBs depending on Phase 1 learnings. For Phase 3 production, custom PCB at scale saves 80%+ on hardware costs.

**Alternative Phase 1 approach:** Buy 1 WiCAN Pro + 1 bare ESP32-S3 kit. Use WiCAN Pro to validate data flow end-to-end while developing custom firmware on the ESP32 in parallel.

---

## Competitor Landscape

The OBD2 app market as of early 2026. This is the field DDPC Connect would enter.

### Tier 1: General-Purpose OBD2 Apps (Direct Competitors)

#### Torque Pro — The Incumbent (Android)
- **Developer:** Ian Hawkins (IAN J HAWKINS LTD, UK). Solo developer, lifestyle business.
- **Price:** $4.95 one-time (Android only)
- **Downloads:** ~4.3M paid (Google Play), ~20-29K/month current
- **Revenue est:** $300-600K/year (declining). No subscription, no iOS.
- **Strengths:** Massive community, custom PID/theme ecosystem, plugin system, unbeatable price-to-feature ratio. The "default" OBD2 app for Android enthusiasts.
- **Weaknesses:** UI frozen circa 2014. No iOS version. No AI. No cloud sync. No vehicle management. Developer appears semi-active (minor updates only). Rating drifting to ~4.0.
- **DDPC angle:** Torque's users are exactly DDPC's target market. ELM327 compatibility captures them without needing to acquire anything.

#### Car Scanner ELM OBD2 — The Modern Free Option
- **Developer:** Stanislav Svistunov / CAR SCANNER LLC. Active since 2018.
- **Price:** Freemium (free with ads, one-time purchase unlocks all features)
- **Downloads:** 10M+ installs (Google Play). Cross-platform: Android, iOS, Windows.
- **Revenue est:** Unknown. Freemium model = likely lower per-user but massive volume.
- **Strengths:** Best free option by far. Pre-built profiles for Tesla, Hyundai Ioniq, Toyota Hybrids — shows battery cell voltage and SOH for free. Supports basic "coding" on Toyota/Lexus/VW. Clean UI, actively maintained. Cross-platform.
- **Weaknesses:** One developer (bus factor). No hardware play. No AI. No vehicle management platform.
- **DDPC angle:** Strongest direct competitor for "modern Torque replacement." DDPC Connect needs to match or exceed Car Scanner's free tier to compete.

#### OBD Fusion — The iOS Mechanic's Choice
- **Developer:** OCTech, LLC (also makes OBDwiz, OBDLink for desktop/Android).
- **Price:** $5.99 one-time + optional manufacturer-specific add-on packs ($5-15 each)
- **Downloads:** ~100K (Google Play — much smaller than Android competitors). Stronger on iOS.
- **Revenue est:** ~$20K/month (Sensor Tower). Modest but stable.
- **Strengths:** Excellent graphing and data logging. Highly customizable dashboards. Easy custom PID creation. Strong DIY mechanic following. Both iOS and Android.
- **Weaknesses:** Last Google Play update Feb 2023 (stale). Small install base relative to competitors. No AI. No cloud. No community features.
- **DDPC angle:** Niche but loyal user base. DDPC Connect's data logging + cloud sync + platform integration would be a clear upgrade path.

#### Infocar — The Polished Newcomer
- **Developer:** Infocar Co., Ltd. (Seoul, South Korea). VC-backed (Korea Credit Guarantee Fund).
- **Price:** Freemium with subscription for premium features.
- **Downloads:** 9.2M+ total, ~4,400/day current. iOS and Android.
- **Revenue est:** Unknown. Subscription model suggests recurring revenue.
- **Strengths:** Best UI in the category by a wide margin. 800+ OBD2 sensor data points. 2,000+ manufacturer-specific sensors. Actively maintained. Cross-platform. Driving style analysis.
- **Weaknesses:** Korean company — less community penetration in US automotive enthusiast space. Subscription model has friction. No hardware play. No vehicle management platform.
- **DDPC angle:** This is what "modern Torque" looks like. DDPC Connect needs to meet this UI bar. Key differentiator: DDPC has the full vehicle management platform behind it; Infocar is diagnostics-only.

### Tier 2: Hardware+App Bundles (Proprietary Ecosystem)

#### BlueDriver — The Consumer-Friendly Bundle
- **Developer:** Lemur Vehicle Monitors (Newfoundland, Canada). ~10-19 employees. Founded 2006.
- **Price:** $119 for BLE adapter (required) + free app. No subscription.
- **Downloads:** 1M+ users claimed. iOS and Android.
- **Revenue est:** ~$1M/year (RocketReach). Hardware-driven revenue.
- **Strengths:** "It just works" experience. Verified repair reports from certified mechanics. Best for non-technical users. No subscription. LexisNexis partnership for fleet/insurance data.
- **Weaknesses:** Proprietary adapter required ($119 premium). Can't use generic ELM327 adapters. Limited customization. Not for enthusiasts who want raw data.
- **DDPC angle:** Different market segment (consumers vs enthusiasts). Not a direct competitor, but proves the hardware+app bundle model works.

#### FIXD — The Consumer Marketing Machine
- **Developer:** FIXD Automotive, Inc. (Atlanta, GA). Raised ~$290K (mostly PPP loan).
- **Price:** $19.99-49.99 for sensor + free app with optional premium subscription.
- **Downloads:** Significant iOS presence. Sensor Tower: ~20K downloads, ~$400K revenue/month (iOS alone).
- **Revenue est:** Potentially $4-5M+/year. Hardware + subscription + aggressive affiliate marketing.
- **Strengths:** Massive marketing spend (Facebook ads, influencer deals, Yahoo/GlobeNewswire coverage). Simple value prop: "know what's wrong before the mechanic does." Subscription revenue for premium features.
- **Weaknesses:** Mixed reviews — some call it overpriced for what it does. Proprietary sensor required. Limited enthusiast features. More marketing than product innovation.
- **DDPC angle:** Proves there's real money in OBD2 consumer hardware. Their marketing playbook is worth studying even if the product is mid.

#### SPARQ — The AI-First Newcomer
- **Developer:** Sparq (California). Founded 2021 by Daniel Nieh and Codrin Cobzaru.
- **Price:** $129 for device. No subscription. iOS and Android.
- **Downloads:** 15,000 devices sold in first 3 months (SoCal launch late 2024).
- **Revenue est:** Early stage. ~$2M from initial device sales.
- **Strengths:** Won 2025 SEMA Best Tools & Equipment Product Award. Full conversational AI ("talk to your car" via voice/text/image/sound). 0-100 health score. Timeline feature showing full vehicle life. Modern, polished UX. No subscription.
- **Weaknesses:** Very early (launched late 2024). Small user base. Proprietary hardware. No enthusiast/modder community. California-only distribution expanding.
- **DDPC angle:** Most aligned competitor in vision — health score, AI diagnostics, timeline. But SPARQ is diagnostics-only; DDPC has the full vehicle management platform (maintenance tracking, mods, parts inventory, community, service planning). DDPC Connect + OBD hardware would be SPARQ's feature set plus everything else.

### Tier 3: Brand-Specific Coding Tools (Adjacent, Not Direct)

#### OBDeleven — VAG Specialist
- **Developer:** OBDeleven (Kaunas, Lithuania). Founded by Edvardas Astrauskas, Martynas Sileika, Aivaras Astrauskas. Bootstrapped.
- **Price:** $60-220 for adapter + free/PRO ($TBD)/ULTIMATE subscription tiers. Expanding from VAG-only to BMW, Toyota, Ford in 2025.
- **Strengths:** Deep VAG coding (enable/disable hidden features). One-Click Apps marketplace. Expanding brand support.
- **Weaknesses:** Primarily a coding tool, not a diagnostics/logging platform. Proprietary hardware. Subscription tiers getting complex.
- **DDPC angle:** Different category (coding vs diagnostics+management). Not competing directly unless DDPC adds ECU coding — which is out of scope for now.

#### Carly — European Luxury Specialist
- **Developer:** Carly GmbH (Munich, Germany). Founded 2014. VC-backed (German Accelerator). ~34 employees.
- **Price:** ~$69-83/year subscription + ~$60 for adapter (or bundled). Enterprise offering for appraisers.
- **Strengths:** Deep BMW/Mercedes coding. Mileage fraud detection (used car buying). Enterprise/fleet offering. Covers ~98% of European vehicles 2004+.
- **Weaknesses:** Expensive (subscription + hardware). Euro-focused. Not an enthusiast/build tool.
- **DDPC angle:** Carly's enterprise/appraiser product is interesting for DDPC's long-term fleet angle, but not a near-term concern.

### Tier 4: AI-Diagnostic Specialists (Emerging)

#### Skanyx — AI Diagnostics
- **Developer:** Skanyx team (details limited). Newer entrant.
- **Price:** Freemium. Pro: €12.99/month or €69/year. Works with any ELM327 adapter.
- **Strengths:** AI cross-references live data against known failure patterns for specific make/model/engine. 0-100 health score across systems. Failure prediction. No proprietary hardware.
- **Weaknesses:** New, unproven at scale. Subscription model. No community/platform features.
- **DDPC angle:** Skanyx's AI diagnostic layer is the feature to watch. DDPC's Steward AI system could absorb this capability — use OBD data to inform AI-driven maintenance recommendations. Skanyx proves the market wants AI + OBD2.

#### OBDAI — Voice-First AI Scanner
- **Developer:** OBDAI (newer entrant).
- **Price:** Hardware + subscription bundles ($50-100+ range).
- **Strengths:** "World's first AI OBD2 scanner" marketing. Voice interaction.
- **Weaknesses:** Very new. Limited market presence. Unproven.
- **DDPC angle:** Marketing noise more than product threat. But confirms the trend: AI + OBD2 is where the market is moving.

### Competitive Summary Matrix

| App | Platform | Price Model | Downloads | AI | Cloud/Platform | Hardware Req | Active Dev |
|-----|----------|-------------|-----------|----|----|-------|------|
| Torque Pro | Android | $4.95 one-time | 4.3M | No | No | Any ELM327 | Minimal |
| Car Scanner | iOS/Android/Win | Freemium | 10M+ | No | No | Any ELM327 | Yes |
| OBD Fusion | iOS/Android | $5.99 + add-ons | 100K+ | No | No | Any ELM327 | Stale |
| Infocar | iOS/Android | Subscription | 9.2M+ | No | Partial | Any ELM327 | Yes |
| BlueDriver | iOS/Android | $119 hardware | 1M+ | No | No | Proprietary | Yes |
| FIXD | iOS/Android | Hardware + sub | Large | No | Yes | Proprietary | Yes |
| SPARQ | iOS/Android | $129 hardware | 15K+ | Yes | Yes | Proprietary | Yes |
| Skanyx | iOS/Android | €69/yr sub | Small | Yes | Yes | Any ELM327 | Yes |
| OBDeleven | iOS/Android | Hardware + sub | Large | No | Yes | Proprietary | Yes |
| Carly | iOS/Android | ~$69/yr + hardware | Large | No | Yes | Proprietary | Yes |
| **DDPC Connect** | **iOS/Android** | **$4.99 + DDPC sub** | **—** | **Yes (Steward)** | **Yes (full platform)** | **Any ELM327 + DDPC hw** | **—** |

### The Gap DDPC Connect Fills

No existing app combines all four of: general-purpose OBD2 diagnostics, full vehicle management platform (maintenance/mods/parts/fuel), AI-powered insights, and open hardware compatibility. Every competitor is missing at least two of these pillars. DDPC Connect's unique position is that OBD2 data feeds into a platform users are already using to manage their builds — it's not a standalone diagnostic tool, it's the telemetry layer for a vehicle lifecycle management system.

---

## DDPC Connect — Companion App Revenue Play

### The Opportunity

The OBD2 app market generates $5-10M+/year across the top apps (Torque, Car Scanner, FIXD, Infocar, Skanyx, Carly). The market is fragmented, most UIs are dated, none integrate with a vehicle management platform, and AI is barely represented. DDPC is already building the firmware and Supabase pipeline for its own OBD2 integration — the companion app is the same code with a different wrapper.

### Product: "DDPC Connect"

A cross-platform (React Native or Flutter) companion app that pairs with any ELM327-compatible OBD2 adapter OR the DDPC-branded hardware.

**Free tier (competes with Torque Lite, Car Scanner free):**
- Live gauges (RPM, speed, coolant, fuel, boost)
- Read/clear DTCs with plain-language explanations
- Basic trip logging
- Real-time data streaming (10+ core PIDs)

**Pro tier — $4.99 one-time OR included with DDPC Pro subscription (competes with Torque Pro, OBD Fusion):**
- Customizable dashboard layouts
- Extended PID support (50+ sensors)
- Data logging with export (CSV, JSON)
- Historical trip data with graphs
- Manufacturer-specific enhanced diagnostics
- Auto-sync to DDPC platform (maintenance logs, fuel logs, odometer updates, DTC→issue reports)
- AI diagnostics via Steward (analyze sensor trends, predict failures, recommend service)

**Hardware bundle option ($49-69):**
- DDPC-branded ESP32 OBD2 adapter (dual-mode: live + WiFi auto-sync)
- Includes DDPC Connect Pro
- No subscription. Ever.

### Revenue Model

| Stream | Price | Type | Notes |
|--------|-------|------|-------|
| DDPC Connect Pro (standalone) | $4.99 | One-time | Matches Torque Pro pricing. No subscription friction. |
| DDPC Pro subscription (includes Connect) | $5-10/mo | Recurring | Full platform access. OBD features are a killer upsell. |
| DDPC OBD2 hardware | $49-69 | One-time | $15-25 margin at DIY BOM. Includes Connect Pro. |
| Hardware + subscription bundle | $49-69 + $5-10/mo | Combo | Hardware as gateway drug to platform subscription. |
| Enterprise/fleet (future) | TBD | Recurring | OBD data for fleet management. Carly Enterprise model. |

### Why This Wins

1. **Price disruption:** $4.99 one-time matches Torque. Undercuts Skanyx (€69/yr), Carly (~$69/yr), FIXD (hardware + sub). No subscription lock-in for the app.
2. **Open hardware:** Works with any $15 ELM327 adapter from Amazon. No proprietary hardware requirement (but DDPC hardware adds WiFi auto-sync as an upsell).
3. **Platform integration:** The killer feature no competitor has. OBD data auto-populates DDPC maintenance logs, fuel logs, odometer, health score, issue reports. The app is useful standalone but 10x useful with the DDPC platform.
4. **AI layer:** Steward AI analyzes OBD sensor trends, predicts failures based on vehicle-specific patterns, recommends service. SPARQ and Skanyx prove the market wants this. DDPC's AI has richer context (full maintenance history, not just current OBD data).
5. **Cross-platform from day one:** React Native/Flutter means iOS + Android simultaneously. Torque is Android-only. OBD Fusion is stale on Android.
6. **Community effect:** DDPC's /community page means users see other builds, compare health scores, share DTC fixes. No competitor has this social layer.

### Build Effort Estimate

Most of the work is already being done for the core OBD2 integration:

| Component | Status | Additional Work for Companion App |
|-----------|--------|----------------------------------|
| ESP32 firmware (dual-mode) | Planned | None — same firmware |
| ELM327 command interpreter | Planned | None — same firmware |
| Supabase ingest pipeline | Planned | Add real-time WebSocket for live data |
| PID database | Planned | Package for mobile app |
| React Native shell | New | ~2-3 weeks for MVP app shell |
| Live gauge UI | New | ~1-2 weeks (reuse DDPC design system) |
| DTC database + plain-language | New | ~1 week (open-source DTC databases exist) |
| App Store submission | New | ~1 week (iOS review, Play Store listing) |
| **Total incremental work** | | **~5-7 weeks beyond core OBD2 integration** |

### Passive Income Potential

This is the Torque model with a modern stack and platform integration. Key passive income characteristics:

- **One-time purchase = zero churn.** User buys once, you keep the revenue forever. No subscription management, no cancellation emails, no retention marketing.
- **App Store discovery.** "OBD2 scanner" is a high-intent search term. Once ranked, organic downloads are effectively free customer acquisition.
- **Hardware margin.** $15-25 profit per DDPC OBD2 adapter. Sell 100/month = $1,500-2,500/month passive hardware revenue.
- **Low maintenance.** OBD2 is a stable protocol (hasn't changed since 2008). PID definitions don't change. Firmware updates are optional improvements, not mandatory. The app doesn't rot the way a social media app does.
- **Upsell funnel.** Free app → Pro app ($4.99) → DDPC hardware ($49-69) → DDPC Pro subscription ($5-10/mo). Each step is optional but natural. The subscription is where the real long-term revenue lives, but the one-time purchases provide immediate income.

**Conservative year-one estimate (post-launch):**
- 500 Pro app purchases/month × $4.99 × 70% (after app store cut) = ~$1,750/mo
- 50 hardware units/month × $20 margin = ~$1,000/mo
- 50 DDPC Pro conversions/month × $7.50/mo = ~$375/mo (growing)
- **Total: ~$3,000-4,000/month by month 12, growing**

This isn't Torque-level passive income on day one, but it's a compounding flywheel: hardware drives app downloads, app drives platform signups, platform drives subscription revenue, and all of it feeds community growth which drives more organic discovery.

---

## Torque / Torque Pro Acquisition Analysis

### Product Overview

| App | Price | Platform | Downloads | Rating |
|-----|-------|----------|-----------|--------|
| Torque Lite | Free | Android | 10M+ | 3.8★ |
| Torque Pro | $4.95 | Android | ~4.3M | 4.3★ |
| Torque (iOS) | — | iOS | Not available | — |

Torque Pro is the dominant OBD2 companion app on Android. It connects to ELM327-compatible Bluetooth/WiFi OBD2 adapters and provides real-time gauges, DTC reading/clearing, fuel economy tracking, and data logging.

### Developer Information

| Detail | Value |
|--------|-------|
| Developer | Ian Hawkins |
| Company | IAN J HAWKINS LTD |
| Location | Newport Pagnell, Buckinghamshire, UK |
| Registration | UK Companies House (limited company) |
| Active since | ~2010 (Torque Pro first published) |
| Other apps | None significant in Play Store |
| Website | torque-bhp.com (minimal, product-focused) |

### Revenue Estimate (Updated 2026-02-22)

**Lifetime (rough ceiling):**
- ~4.3M paid downloads × $4.95 = ~$21.3M gross lifetime revenue (theoretical max)
- Google Play takes 15-30% → ~$15-18M net ceiling over 15+ years
- Actual lifetime net is lower due to piracy, refunds, regional pricing

**Current run rate (estimated):**
- Sensor Tower estimates ~20-29K downloads/month (Feb 2025 data)
- At $4.95 × ~25K/mo = ~$125K/mo gross → ~$85-105K/mo net (after Google's cut)
- **However:** Sensor Tower estimates are notoriously inflated for long-tail apps. Real paid downloads likely 30-50% of reported figures.
- **Realistic estimate: $300K-600K/year current revenue, declining**
- No subscription model — one-time purchase only, no recurring revenue
- App rating drifted to ~4.0★, user forums show frustration with stale UI
- OBD2 app market is more competitive now (Car Scanner, OBD Fusion, etc.)
- Last meaningful update: Feb 2025 (minor), no major visual refresh in ~10 years
- Rampant APK piracy further depresses actual paid download counts

**Ian Hawkins net worth:** Not publicly disclosed. UK micro-entity filing (IAN J HAWKINS LTD, company #08373845) does not require revenue disclosure. He also develops a small indie game called "WinterSun." This is a solo lifestyle business, not a venture-backed company.

### Acquisition Feasibility

**Challenges:**
- No public indication the app or company is for sale
- Solo developer pulling $300-600K/year from an app he barely touches — no motivation to sell (this is the hardest acquisition type)
- Single-developer company — IP, maintenance knowledge, and codebase tightly coupled to Ian Hawkins personally
- Android-only limits cross-platform value (iOS "Torque Pro" apps are from different developers)
- No known acquisition history or M&A activity
- UK-based company adds international transaction complexity
- 15-year-old codebase likely has significant technical debt

**Potential value to DDPC:**
- Play Store ranking and brand recognition in OBD2 search results
- Access to ~25K new users/month already buying OBD2 tools
- PID database and protocol handling code (though open-source alternatives exist)
- Could rebrand or integrate as "DDPC Connect" or similar

**Estimated acquisition cost:**
- Rule of thumb for app acquisitions: 2-4x annual revenue
- At $300-600K/year current revenue: **$600K-$2.4M range**
- Likely on the higher end — seller has no pressure to exit and passive income is attractive
- Counter-argument: declining revenue + aging codebase + single-platform = depreciating asset

**Recommendation: Do NOT pursue acquisition.**
1. DDPC should build its own OBD2 integration (this document's primary focus)
2. Building ELM327 compatibility into custom firmware captures Torque's user base directly — those users already have OBD2 adapters and are exactly DDPC's target market
3. A DDPC companion app tightly integrated with the platform is worth more than a 15-year-old app with technical debt and no recurring revenue
4. If Torque's value is distribution, DDPC can achieve the same via Play Store SEO + existing automotive enthusiast community
5. Revisit only if Ian Hawkins proactively signals interest in selling (e.g., app goes unmaintained for 12+ months, or he reaches out)

### Alternative to Acquisition

Instead of acquiring Torque Pro, DDPC could:
- Build ELM327 compatibility into the custom firmware → Torque Pro users can use their existing adapters with DDPC
- Create a DDPC companion app that replaces Torque's functionality but is tightly integrated with the DDPC platform
- Partner with WiCAN (open-source, already has community) rather than acquiring a closed-source app

---

## Appendix: Useful Resources

- [OBD-II PID Wikipedia](https://en.wikipedia.org/wiki/OBD-II_PIDs) — Complete PID reference
- [WiCAN Firmware Source](https://github.com/meatpiHQ/wican-fw) — GPL-3.0 reference implementation
- [ESP-IDF TWAI Driver Docs](https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/api-reference/peripherals/twai.html) — Native CAN driver
- [ELMduino Library](https://github.com/PowerBroker2/ELMduino) — Arduino OBD2 library
- [MeatPi Electronics](https://www.meatpi.com/) — WiCAN manufacturer
- [PlatformIO ESP32 Guide](https://docs.platformio.org/en/latest/boards/espressif32/) — Development environment
- [SAE J1979 Standard](https://www.sae.org/standards/content/j1979_202202/) — OBD2 diagnostic services specification (paid)
