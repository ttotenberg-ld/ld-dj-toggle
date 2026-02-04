# LaunchDarkly Integration Guide for Strudel

This document outlines how to use the LaunchDarkly integration from `launchdarkly.mjs` to dynamically control various aspects of your Strudel loops.

## The `flag()` Function

The `flag()` function returns a **Pattern** that reactively reads LaunchDarkly flag values. This makes it compatible with any Strudel method that accepts a pattern.

```javascript
flag(key, defaultValue)
```

- `key` - The LaunchDarkly flag key
- `defaultValue` - Fallback value if the flag is not set

Since `flag()` returns a Pattern, it integrates seamlessly with Strudel's existing methods.

### Mini-Notation Support

The `flag()` function automatically detects and parses mini-notation in string flag values. If your flag contains characters like `<>`, `[]`, `*`, `!`, `@`, or `,`, it will be parsed as a mini-notation pattern.

```javascript
// Flag 'scale' can contain mini-notation like "<g:minor eb:major bb:major>"
// This will be automatically parsed and cycle through the scales
$: n("<0 2 4>")
  .scale(flag('scale', '<g:minor>'))
```

---

## Current Loop Reference

This is the default code that loads in the Strudel REPL with LaunchDarkly integration:

```javascript
setcpmFlag('globalTempo', 110, 4) // 110 BPM in 4/4 time

$: n("<0 2 0 3 4 0 9 8>")
  .polySpeed('melodySpeed', 16)
  .scale(flag('scale', '<g:minor>'))
  .toggle('melodyEnabled', true)
  ._punchcard()

$: n("<0 2 0 3 4>*16")
  .scale(flag('scale', '<g:minor>'))
  .leadSound('leadSynthSettings', { sound: 'supersaw' })
  .toggle('leadEnabled', true)
  ._punchcard()

$: n("<0@2 4@2>*8")
  .scale(flag('scale', '<g:minor>'))
  .trans(-12)
  .toggle('bassEnabled', true)
  ._punchcard()

$: s("bd!4, [- sd - sd], [hh*8]")
  .drumKit('drumKitSettings', { bank: 'RolandTR808' })
  .toggle('drumsEnabled', true)
  ._scope()
```

---

## 1. Global Tempo Control

### Goal
Dynamically control the global tempo via a LaunchDarkly flag. Changes take effect immediately.

### Flag: `globalTempo`
**Type:** Number (BPM values)

**Example Values:**
- `80` - 80 BPM (slow)
- `100` - 100 BPM (moderate)
- `110` - 110 BPM (default)
- `120` - 120 BPM (upbeat)
- `140` - 140 BPM (fast)

### Usage

Use `setcpmFlag()` at the top of your code to set tempo from a LaunchDarkly flag:

```javascript
// Set tempo from 'globalTempo' flag storing BPM, with divisor 4 for 4/4 time
// Falls back to 110 BPM if flag is not set
setcpmFlag('globalTempo', 110, 4)

$: s("bd!4, [- sd - sd], [hh*8]")
  .bank("RolandTR808")
  ._scope()
```

### Function Signature

```javascript
setcpmFlag(flagKey, defaultValue, divisor)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `flagKey` | string | (required) | The LaunchDarkly flag key |
| `defaultValue` | number | `100` | Default tempo if flag is not set |
| `divisor` | number | `1` | Divides the flag value to get CPM. Use `4` for 4/4 time when storing BPM |

### How It Works

The `setcpmFlag()` function:
1. Reads the tempo value from the specified LaunchDarkly flag
2. Divides by the `divisor` to convert to CPM (e.g., 110 BPM ÷ 4 = 27.5 CPM)
3. Sets the global tempo immediately using `setcpm()`
4. Automatically updates the tempo when the flag value changes in LaunchDarkly
5. Returns `silence` (like `setcpm`), so it can be placed at the top of your code

### CPM vs BPM

Strudel uses **cycles per minute (CPM)**, not beats per minute (BPM). The `divisor` parameter handles this conversion:
- For 4/4 time: use `divisor = 4` (CPM = BPM / 4)
- For 3/4 time: use `divisor = 3` (CPM = BPM / 3)
- For CPM directly: use `divisor = 1` (default)

### LaunchDarkly Flag Setup

Create a number flag in LaunchDarkly:
- **Flag key:** `globalTempo`
- **Flag type:** Number
- **Variations:** Different BPM values (e.g., 80, 100, 110, 120, 140)

---

## 2. Melody Speed Control

### Goal
Switch the melody speed between values like `16`, `8`, `4`, etc. via a LaunchDarkly flag.

### Flag: `melodySpeed`
**Type:** JSON Array or Number

**Example Values:**
- `16` - 16 notes per cycle (single speed)
- `8` - 8 notes per cycle  
- `4` - 4 notes per cycle
- `[16, 4]` - Polyphonic: both 16 AND 4 notes per cycle layered together

### Usage Options

#### Option A: Sequential Speed (single speed at a time)

Use `flag()` directly with Strudel's `.fast()` method:

```javascript
$: n("<0 2 0 4 9 7>")
  .fast(flag('melodySpeed', 16))
  .scale("<g:minor eb:major bb:major d:major>")
  ._punchcard()
```

#### Option B: Polyphonic Speed (multiple speeds layered together)

Use `.polySpeed()` for polyphonic timing like mini-notation `*[16,4]`:

```javascript
$: n("<0 2 0 4 9 7>")
  .polySpeed('melodySpeed', [16, 4])
  .scale("<g:minor eb:major bb:major d:major>")
  ._punchcard()
```

**Key difference:**
- `fast(16)` or `fast(flag(...))` - Pattern plays at ONE speed
- `*[16,4]` or `.polySpeed(...)` - Pattern plays at MULTIPLE speeds simultaneously (polyphonic)

The `.polySpeed()` method accepts either:
- A single number (e.g., `16`) - behaves like `fast(16)`
- An array of numbers (e.g., `[16, 4]`) - creates layered polyphony like `*[16,4]`

The flag value is read reactively, so changes in LaunchDarkly take effect immediately.

---

## 3. Drum Effects Control

### Goal
Dynamically adjust drum effects like delay and reverb.

### Flags
| Flag Key | Type | Purpose |
|----------|------|---------|
| `drumDelay` | Number | Delay wet amount (0-1) |
| `drumRoom` | Number | Reverb wet amount (0-1) |
| `drumGain` | Number | Volume multiplier |

### Usage

Use `flag()` directly with Strudel's effect methods:

```javascript
$: s("bd!4, [- sd - sd], [hh*8]")
  .bank("RolandTR909")
  .delay(flag('drumDelay', 0.2))
  .room(flag('drumRoom', 0.3))
  .gain(flag('drumGain', 1))
  ._scope()
```

### Extended Effects

You can control additional effect parameters the same way:

```javascript
$: s("bd!4, [- sd - sd], [hh*8]")
  .bank("RolandTR909")
  .delay(flag('drumDelay', 0.2))
  .delaytime(flag('drumDelaytime', 0.125))
  .delayfeedback(flag('drumFeedback', 0.3))
  .room(flag('drumRoom', 0.3))
  .roomsize(flag('drumRoomsize', 2))
  .gain(flag('drumGain', 1))
  ._scope()
```

---

## 4. Drum Kit Control

### Goal
Dynamically switch between different drum machine banks and apply combined settings.

### Flag: `drumKitSettings`
**Type:** JSON Object

**Example Value:**
```json
{
  "bank": "RolandTR808",
  "gain": 1.2,
  "delay": 0.2,
  "room": 0.3
}
```

### Supported Properties
| Property | Type | Purpose |
|----------|------|---------|
| `bank` | String | Drum machine bank (e.g., 'RolandTR808', 'RolandTR909', 'LinnDrum') |
| `gain` | Number | Volume multiplier (default: 1) |
| `delay` | Number | Delay amount (0-1) |
| `room` | Number | Reverb amount (0-1) |
| ...any other | Various | Any Strudel audio effect property |

### Usage

```javascript
$: s("bd!4, [- sd - sd], [hh*8]")
  .drumKit('drumKitSettings', { bank: 'RolandTR808', gain: 1 })
  ._scope()
```

### Alternative: Using `flag()` with `.bank()`

For simpler control of just the drum bank:

```javascript
$: s("bd!4, [- sd - sd], [hh*8]")
  .bank(flag('drumBank', 'RolandTR909'))
  .delay(flag('drumDelay', 0.2))
  .room(flag('drumRoom', 0.3))
  ._scope()
```

---

## 5. Bass Sound Control

### Goal
Dynamically control bass synth settings including sound source, filter, and gain.

### Flag: `bassSoundSettings`
**Type:** JSON Object

**Example Value:**
```json
{
  "sound": "gm_synth_bass_2",
  "lpf": 1800,
  "gain": 1.2
}
```

### Supported Properties
| Property | Type | Purpose |
|----------|------|---------|
| `sound` | String | Sound/synth name (e.g., 'gm_synth_bass_2', 'sawtooth') |
| `lpf` | Number | Low-pass filter cutoff frequency (Hz) |
| `gain` | Number | Volume multiplier (default: 1) |
| ...any other | Various | Any Strudel audio effect property |

### Usage

```javascript
$: note("e2 f2 g2 a2")
  .bassSound('bassSoundSettings', { sound: 'gm_synth_bass_2', lpf: 1800, gain: 1 })
  ._punchcard()
```

### How It Works

The `.bassSound()` method:
1. Reads the flag value dynamically on each trigger
2. Parses JSON if the flag value is a string
3. Applies the `sound` property as the `s` (sound source)
4. Multiplies gain values (preserving existing gain)
5. Applies any additional effect properties

---

## 6. Lead Synth Control

### Goal
Dynamically control lead synthesizer settings including sound source, filter, resonance, and gain.

### Flag: `leadSynthSettings`
**Type:** JSON Object

**Example Value:**
```json
{
  "sound": "sawtooth",
  "lpf": 2000,
  "lpq": 5,
  "gain": 0.8
}
```

### Supported Properties
| Property | Type | Purpose |
|----------|------|---------|
| `sound` | String | Sound/synth name (e.g., 'sawtooth', 'supersaw', 'gm_lead_2_sawtooth') |
| `lpf` | Number | Low-pass filter cutoff frequency (Hz) |
| `lpq` | Number | Filter resonance/Q |
| `gain` | Number | Volume multiplier (default: 1) |
| ...any other | Various | Any Strudel audio effect property |

### Usage

```javascript
$: note("c4 e4 g4 b4")
  .leadSound('leadSynthSettings', { sound: 'sawtooth', lpf: 300, lpq: 0, gain: 1 })
  ._punchcard()
```

### How It Works

The `.leadSound()` method:
1. Reads the flag value dynamically on each trigger
2. Parses JSON if the flag value is a string
3. Applies the `sound` property as the `s` (sound source)
4. Applies `lpf` and `lpq` filter settings if provided
5. Multiplies gain values (preserving existing gain)
6. Applies any additional effect properties

---

## 7. Bass and Melody Transpose

### Goal
Dynamically transpose bass or melody lines.

### Flag: `bassTranspose`
**Type:** Number (semitones)

### Usage

```javascript
$: n("<0@2 4@2>*8")
  .scale("<g:minor eb:major bb:major d:major>")
  .trans(flag('bassTranspose', -12))
  ._punchcard()
```

---

## 8. Filter Control

### Goal
Dynamically control low-pass and high-pass filters.

### Flags
| Flag Key | Type | Purpose |
|----------|------|---------|
| `lpfCutoff` | Number | Low-pass filter frequency (Hz) |
| `hpfCutoff` | Number | High-pass filter frequency (Hz) |
| `filterResonance` | Number | Filter resonance/Q |

### Usage

```javascript
$: n("<0 2 0 4 9 7>")
  .fast(flag('melodySpeed', 16))
  .scale("<g:minor eb:major bb:major d:major>")
  .lpf(flag('lpfCutoff', 2000))
  .lpq(flag('filterResonance', 5))
  ._punchcard()
```

---

## 9. Voice Toggle Control

### Goal
Dynamically enable or disable entire voices (drums, melody, bass, etc.) using boolean flags.

### Flags
| Flag Key | Type | Purpose |
|----------|------|---------|
| `drumsEnabled` | Boolean | Enable/disable drum track |
| `melodyEnabled` | Boolean | Enable/disable melody |
| `bassEnabled` | Boolean | Enable/disable bass line |
| `leadEnabled` | Boolean | Enable/disable lead synth |

### Usage

Use `.toggle()` at the end of any pattern chain to conditionally enable/disable it:

```javascript
// Drums - can be toggled on/off
$: s("bd!4, [- sd - sd], [hh*8]")
  .drumKit('drumKitSettings', { bank: 'RolandTR808' })
  .toggle('drumsEnabled', true)
  ._scope()

// Melody - can be toggled on/off
$: n("<0 2 0 3 4 0 9 8>")
  .polySpeed('melodySpeed', 16)
  .scale(flag('scale', '<g:minor>'))
  .toggle('melodyEnabled', true)
  ._punchcard()

// Bass - can be toggled on/off
$: n("<0@2 4@2>*8")
  .scale(flag('scale', '<g:minor>'))
  .trans(-12)
  .toggle('bassEnabled', true)
  ._punchcard()
```

### How It Works

- When the flag is `true` (or truthy), the pattern plays normally
- When the flag is `false` (or falsy), the pattern is completely silenced
- Changes take effect immediately - no need to restart the loop
- The second parameter is the default value if the flag doesn't exist

### LaunchDarkly Flag Setup

Create boolean flags in LaunchDarkly:
- **Flag key:** `drumsEnabled`
- **Flag type:** Boolean
- **Variations:** `true` (on), `false` (off)

---

## 10. Lead Arrangement Selection

### Goal
Dynamically switch between completely different lead synth arrangements (including note patterns, sounds, and effects) using a single LaunchDarkly flag as a selector.

### Flag: `leadArrangement`
**Type:** String (variation selector)

**Example Values:**
- `techno` - Aggressive supersaw arpeggios with scale-based patterns
- `epiano` - Warm jazz chords with GM electric piano sound
- `organ` - Wide octave spreads with cathedral pipe organ sound
- `original` - Syncopated sawtooth with full ADSR and filter envelope effects
- `piano` - Gentle Steinway piano intro

### Usage

First, define your lead variations as a map of pattern factories:

```javascript
const leadVariations = {
  // Techno - aggressive supersaw arpeggios
  techno: () => arrange(
    [3, "<0 4 0 9 7>*16".scale("[e:minor f:major]")],
    [1, "<0 4 0 9 7>*16".scale("[g:major a:minor]")]
  ).note().sound("supersaw"),

  // Electric Piano - warm jazz chords
  epiano: () => arrange(
    [3, "<[[e3,b3,g3,e4] [- - [e3,b3,g3,e4] - - ]] [ - [f3,c4,a3,f4]]>*2"],
    [1, "<[g3,d4,b3,g4] [a3,e4,c4,a4]>*2"]
  ).note().sound("gm_epiano1").gain(1.5).release(.4),

  // Organ - cathedral pipe organ
  organ: () => arrange(
    [3, "<[e1,e2,e3,b3,g3,e4] [f1,f2,f3,c4,a2,f4]>*2"],
    [1, "<[g1,g2,g3,d4,b3,g5] [a1,a2,a3,e4,c4,a4]>*2"]
  ).note().sound("pipeorgan_loud").gain(2).release(.4),

  // Original - syncopated sawtooth with effects
  original: () => arrange(
    [3, "<[[e3,b3] - c4 -] [e3 - f3 c4] [- c4 a4 -] [- - - -]>*4"],
    [1, "<[- - [g3,b3] -] [g3 - a3 c4] [- c4 c5 -] [c4 - g4 -]>*4"]
  ).note().sound("sawtooth")
    .attack(0).decay(.25).sustain(0).release(.3)
    .lpf(300).lpq(0).lpenv(3).lpa(0).lpd(.15).lps(0)
    .delay(.2).delaytime(.25).delayfeedback(.1)
};

// Use the flag to dynamically select the lead arrangement
// Falls back to 'original' if the flag is not set or invalid
let lead_synth = getLeadArrangement('leadArrangement', 'original', leadVariations);
```

### Function Signature

```javascript
getLeadArrangement(flagKey, defaultVariation, variations)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `flagKey` | string | The LaunchDarkly flag key containing the variation name |
| `defaultVariation` | string | Fallback variation name if flag is not set or invalid |
| `variations` | object | Map of variation names to pattern factory functions |

### How It Works

The `getLeadArrangement()` function:
1. Reads the variation name from the specified LaunchDarkly flag
2. Looks up the corresponding pattern factory in the variations map
3. Falls back to the default variation if the flag value doesn't match any key
4. Calls the factory function to create the pattern
5. Caches the pattern until the flag value changes (for efficiency)
6. Returns a Pattern that can be used like any other Strudel pattern

### Benefits Over `.leadSound()`

While `.leadSound()` only controls sound source and effects, `getLeadArrangement()` allows switching:
- **Note patterns** - completely different melodies/chord voicings
- **Timing divisions** - different `arrange()` structures
- **Sound source** - different synths/samples
- **Effect chains** - unique effects per variation

### LaunchDarkly Flag Setup

Create a string flag in LaunchDarkly:
- **Flag key:** `leadArrangement`
- **Flag type:** String (multivariate)
- **Variations:**
  - `techno` - "Techno Supersaw"
  - `epiano` - "Electric Piano"
  - `organ` - "Pipe Organ"
  - `original` - "Original Sawtooth"
  - `piano` - "Piano"
- **Default on variation:** Your preferred starting variation
- **Default off variation:** `original` (safe fallback)

---

## 11. Complete Example: Full Loop with Flags

Here's how your loop looks using all the LaunchDarkly features:

```javascript
// Set tempo from LaunchDarkly flag (reactive updates)
setcpmFlag('globalTempo', 110, 4) // 110 BPM in 4/4 time

// Melody with polyphonic speed control, filter, and toggle
$: n("<0 2 0 3 4 0 9 8>")
  .polySpeed('melodySpeed', 16)
  .scale(flag('scale', '<g:minor>'))
  .lpf(flag('melodyLpf', 4000))
  .gain(flag('melodyGain', 1))
  .toggle('melodyEnabled', true)
  ._punchcard()

// Lead synth with sound settings and toggle
$: n("<0 2 0 3 4>*16")
  .scale(flag('scale', '<g:minor>'))
  .leadSound('leadSynthSettings', { sound: 'supersaw' })
  .toggle('leadEnabled', true)
  ._punchcard()

// Bass with dynamic transpose and toggle
$: n("<0@2 4@2>*8")
  .scale(flag('scale', '<g:minor>'))
  .trans(flag('bassTranspose', -12))
  .bassSound('bassSoundSettings', { sound: 'gm_synth_bass_2', lpf: 1800 })
  .toggle('bassEnabled', true)
  ._punchcard()

// Drums with kit settings and toggle
$: s("bd!4, [- sd - sd], [hh*8]")
  .drumKit('drumKitSettings', { bank: 'RolandTR808' })
  .delay(flag('drumDelay', 0.2))
  .room(flag('drumRoom', 0.3))
  .toggle('drumsEnabled', true)
  ._scope()
```

---

## 12. LaunchDarkly Flag Setup

### Recommended Flags to Create

| Flag Key | Type | Default | Purpose |
|----------|------|---------|---------|
| `globalTempo` | Number | `110` | Global tempo in BPM (divided by 4 in code for 4/4 time) |
| `scale` | String | `"<g:minor>"` | Musical scale (supports mini-notation) |
| `melodySpeed` | JSON | `[16, 4]` | Melody note density (array for polyphonic timing) |
| `melodyLpf` | Number | `4000` | Melody filter cutoff |
| `melodyGain` | Number | `1` | Melody volume |
| `melodyEnabled` | Boolean | `true` | Enable/disable melody |
| `leadSynthSettings` | JSON | `{"sound": "supersaw"}` | Lead synth configuration |
| `leadEnabled` | Boolean | `true` | Enable/disable lead synth |
| `bassTranspose` | Number | `-12` | Bass octave shift |
| `bassSoundSettings` | JSON | `{"sound": "gm_synth_bass_2", "lpf": 1800}` | Bass sound configuration |
| `bassEnabled` | Boolean | `true` | Enable/disable bass |
| `drumKitSettings` | JSON | `{"bank": "RolandTR808"}` | Drum kit configuration |
| `drumDelay` | Number | `0.2` | Drum delay amount |
| `drumRoom` | Number | `0.3` | Drum reverb amount |
| `drumsEnabled` | Boolean | `true` | Enable/disable drums |

### Example Variations in LaunchDarkly

**scale (with mini-notation):**
- Single scale: `"g:minor"`
- Cycling scales: `"<g:minor eb:major bb:major d:major>"`

**melodySpeed (with polySpeed):**
- Polyphonic Fast: `[16, 4]` (fast arpeggios + slow melody layered)
- Fast: `[16]` (16 notes per cycle)
- Moderate: `[8]` (8 notes per cycle)
- Polyphonic Moderate: `[8, 2]` (moderate + sparse layered)
- Slow: `[4]` (4 notes per cycle)

**drumKitSettings:**
- TR-808: `{"bank": "RolandTR808", "gain": 1}`
- TR-909: `{"bank": "RolandTR909", "gain": 1.2}`
- With effects: `{"bank": "RolandTR808", "delay": 0.3, "room": 0.4}`

**leadSynthSettings:**
- Supersaw: `{"sound": "supersaw", "gain": 0.8}`
- Filtered saw: `{"sound": "sawtooth", "lpf": 2000, "lpq": 5}`

---

## 13. Available Strudel Parameters

These are common parameters you can control with `flag()`:

### Timing
- `.fast(n)` - Speed multiplier
- `.slow(n)` - Slowdown multiplier

### Effects
- `.delay(n)` - Delay wet (0-1)
- `.delaytime(n)` - Delay time in seconds
- `.delayfeedback(n)` - Delay feedback (0-1)
- `.room(n)` - Reverb wet (0-1)
- `.roomsize(n)` - Reverb size

### Filters
- `.lpf(n)` - Low-pass filter frequency
- `.hpf(n)` - High-pass filter frequency
- `.lpq(n)` - Filter resonance

### Dynamics
- `.gain(n)` - Volume
- `.pan(n)` - Stereo position (-1 to 1)
- `.speed(n)` - Playback speed

### Pitch
- `.trans(n)` - Transpose by semitones

---

## 14. Custom Methods Summary

These are the custom methods and functions added by the LaunchDarkly integration:

### Global Functions

| Function | Purpose | Flag Type |
|----------|---------|-----------|
| `setcpmFlag(flagKey, default, divisor)` | Reactive global tempo control | Number (BPM with divisor) |
| `getLeadArrangement(flagKey, default, variations)` | Switch between pre-defined lead arrangements | String (variation selector) |

### Pattern Methods

| Method | Purpose | Flag Type |
|--------|---------|-----------|
| `.polySpeed(flagKey, default)` | Polyphonic speed control (like `*[a,b]`) | Number or Array |
| `.drumKit(flagKey, default)` | Combined drum bank + effects | JSON Object |
| `.bassSound(flagKey, default)` | Bass synth configuration | JSON Object |
| `.leadSound(flagKey, default)` | Lead synth configuration | JSON Object |
| `.toggle(flagKey, default)` | Enable/disable pattern | Boolean |

---

## 15. Benefits of This Integration

1. **Reactive updates** - Changes in LaunchDarkly apply immediately without restarting
2. **Composable** - `flag()` works anywhere a pattern is accepted
3. **Mini-notation support** - Flag values can contain Strudel mini-notation
4. **Combined settings** - Methods like `.drumKit()` and `.leadSound()` bundle related settings
5. **Toggle control** - Easily enable/disable entire voices for A/B testing

---

## 16. Potential Additional Integrations

The following Strudel features are **not yet integrated** with LaunchDarkly but represent opportunities for future development:

### Global Tempo & Timing Control

| Feature | Description | Potential Flag Type | Status |
|---------|-------------|---------------------|--------|
| `setcpm()` / `setCps()` | Global tempo control (cycles per minute / cycles per second) | Number | ✅ **Implemented** as `setcpmFlag()` |
| `nudge()` | Fine-tune timing offset in seconds | Number | Not yet implemented |
| `swing()` | Apply swing feel to patterns | Number (0-1) | Not yet implemented |

**Implemented - see section 1:**
```javascript
// Use setcpmFlag for reactive tempo control
setcpmFlag('globalTempo', 110, 4) // 110 BPM in 4/4 time
```

### Advanced Audio Effects

| Effect | Description | Potential Flag Type |
|--------|-------------|---------------------|
| `phaser` / `phaserdepth` | Phaser modulation speed and depth | Number |
| `tremolo` | Amplitude modulation | Number |
| `crush` | Bit crusher effect | Number (1-16 bits) |
| `distort` | Distortion amount | Number |
| `coarse` | Sample rate reduction | Number |
| `vowel` | Vowel formant filter | String ("a", "e", "i", "o", "u") |
| `shape` | Waveshaping distortion | Number |

**Example Usage:**
```javascript
$: note("c3 e3 g3")
  .s("sawtooth")
  .phaser(flag('phaser-speed', 0.5))
  .phaserdepth(flag('phaser-depth', 0.5))
```

### MIDI Output Control

| Feature | Description | Potential Flag Type |
|---------|-------------|---------------------|
| `midiport` | Select MIDI output device | String |
| `midichan` | MIDI channel selection | Number (1-16) |
| `velocity` | Note velocity | Number (0-1) |
| `ccn` / `ccv` | MIDI CC controller and value | Number |
| `progNum` | MIDI program change | Number (0-127) |
| `midibend` | Pitch bend | Number (-1 to 1) |

**Example Usage:**
```javascript
$: note("c4 e4 g4")
  .midi(flag('midi-device', 'IAC Driver'))
  .midichan(flag('midi-channel', 1))
  .velocity(flag('midi-velocity', 0.8))
```

### OSC Output

| Feature | Description | Potential Flag Type |
|---------|-------------|---------------------|
| `osc` | Send events via OSC (e.g., to SuperCollider/SuperDirt) | Boolean |
| OSC port/host | Configure OSC destination | String/Number |

**Example Usage:**
```javascript
// Toggle OSC output for integration with SuperDirt
$: s("bd sd")
  .toggle('use-osc', false)
  .osc()
```

### Visualization Control

| Feature | Description | Potential Flag Type |
|---------|-------------|---------------------|
| `_pianoroll()` | Piano roll visualization settings (cycles, playhead position) | JSON Object |
| `_spiral()` | Spiral visualization | JSON Object |
| `_scope()` | Oscilloscope display | JSON Object |
| `color` | Visualization color | String (CSS color) |
| Hydra integration | Enable/configure Hydra visual effects | Boolean/JSON |

**Example Implementation:**
```javascript
// A .visualizer() method that switches between display modes
$: n("0 2 4")
  .scale("C:major")
  .visualizer('viz-settings', { type: 'pianoroll', cycles: 4 })
```

### Chord & Voicing Control

| Feature | Description | Potential Flag Type |
|---------|-------------|---------------------|
| `voicing()` | Chord voicing style | String ("lefthand", "triads", "guidetones") |
| `voicingRange` | Note range for voicings | Array [low, high] |
| `chord()` | Chord type/quality | String |
| `rootNote` | Anchor for voicings | String (note name) |

**Example Usage:**
```javascript
$: chord(flag('chord-progression', '<C^7 Am7 Dm7 G7>'))
  .voicing(flag('voicing-style', 'lefthand'))
```

### Sample & Soundfont Selection

| Feature | Description | Potential Flag Type |
|---------|-------------|---------------------|
| `samples()` URL | Dynamically load sample packs | String (URL) |
| GM Instrument selection | Select General MIDI instruments | String or Number |
| `n` sample index | Select specific sample from bank | Number |
| `begin` / `end` | Sample start/end points | Number (0-1) |
| `cut` | Cut group for sample choking | Number |

**Example Implementation:**
```javascript
// A .samplePack() method for dynamically loading samples
$: s("bd sd hh")
  .samplePack('sample-source', 'github:tidalcycles/dirt-samples')
```

### Pattern Transformation Methods

| Feature | Description | Potential Flag Type |
|---------|-------------|---------------------|
| `jux(fn)` | Apply function to right channel | Function/Boolean |
| `rev()` | Reverse pattern | Boolean |
| `palindrome()` | Play forward then backward | Boolean |
| `every(n, fn)` | Apply function every N cycles | JSON {n, fn} |
| `sometimes(fn)` | Randomly apply function | Number (probability) |
| `degradeBy(prob)` | Randomly drop events | Number (0-1) |
| `euclid(k, n)` | Euclidean rhythm generator | Array [pulses, steps] |

**Example Usage:**
```javascript
$: s("bd sd cp sd")
  .jux(rev)
  .degradeBy(flag('chaos-amount', 0))
```

### Envelope (ADSR) Control

| Feature | Description | Potential Flag Type |
|---------|-------------|---------------------|
| `attack` | Attack time (seconds) | Number |
| `decay` | Decay time (seconds) | Number |
| `sustain` | Sustain level (0-1) | Number |
| `release` | Release time (seconds) | Number |

**Example Implementation:**
```javascript
// An .envelope() method bundling ADSR settings
$: note("c3 e3 g3")
  .s("sawtooth")
  .envelope('pad-envelope', { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.5 })
```

### Spatial Audio

| Feature | Description | Potential Flag Type |
|---------|-------------|---------------------|
| `pan` | Stereo panning | Number (-1 to 1) |
| `orbit` | Bus/effects send routing | Number |
| `channels` | Output channel routing | String ("1:2") |

**Example Usage:**
```javascript
$: s("hh*8")
  .pan(flag('hh-pan', sine.slow(2)))  // Supports pattern values!
```

### Dynamic Pattern Injection

| Feature | Description | Potential Flag Type |
|---------|-------------|---------------------|
| Full pattern string | Inject entire mini-notation patterns | String |
| Note sequence | Dynamic note patterns | String |
| Rhythm pattern | Dynamic rhythm patterns | String |

**Example Implementation:**
```javascript
// A .pattern() method that parses flag as complete mini-notation
$: pattern(flag('user-pattern', 'bd sd [~ bd] sd'))
  .bank("RolandTR808")
```

### Probabilistic Control

| Feature | Description | Potential Flag Type |
|---------|-------------|---------------------|
| `rand` seed | Set random seed for reproducibility | Number |
| `probability` | Event probability | Number (0-1) |
| `choose` weights | Weighted random selection | Array |

**Example Usage:**
```javascript
$: s("bd sd? cp sd")  // ? means 50% probability
  .sometimesBy(flag('glitch-probability', 0.1), crush(4))
```

---

### Implementation Priority Suggestions

**High Value, Lower Complexity:**
1. ~~Global tempo control (`setcpm` via flag)~~ ✅ **Done** - see `setcpmFlag()`
2. Additional effect bundles (phaser, distortion packs)
3. MIDI device/channel selection
4. Envelope bundles (ADSR as JSON object)

**High Value, Higher Complexity:**
5. Dynamic pattern injection (full mini-notation from flags)
6. Visualization mode switching
7. Voicing/chord control
8. Sample pack hot-swapping

**Niche but Powerful:**
9. OSC output toggle for SuperDirt users
10. Euclidean rhythm parameters
11. Probabilistic/chaos controls
12. Hydra visual integration

---

### Notes for Implementation

When implementing additional integrations, follow these patterns from the existing code:

1. **For simple numeric/string values:** Use `flag()` directly with existing Strudel methods
   ```javascript
   .pan(flag('pan-position', 0))
   ```

2. **For bundled settings:** Create new Pattern prototype methods (like `.drumKit()`)
   ```javascript
   Pattern.prototype.newMethod = function(flagKey, defaultValue) {
     return this.withHap((hap) => {
       const flagValue = flags[flagKey] ?? defaultValue;
       // Apply transformations...
     });
   };
   ```

3. **For conditional logic:** Follow the `.toggle()` pattern
   ```javascript
   return new Pattern((state) => {
     const enabled = flags[flagKey] ?? defaultValue;
     if (enabled) return self.query(state);
     return [];
   });
   ```

4. **For pattern-level changes:** Follow the `.polySpeed()` pattern using `new Pattern()`
