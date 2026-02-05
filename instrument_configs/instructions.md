# Instrument Configuration with LaunchDarkly Flags

This document describes how to set up dynamic instrument switching using LaunchDarkly flags. Use this as a template for adding flag-controlled variations to any instrument part.

---

## Summary: What Was Done for Lead Synth

The lead synth was configured to dynamically switch between 5 different arrangements (electric piano, organ, techno supersaw, original sawtooth, and piano) using a single LaunchDarkly flag.

---

## Step-by-Step Process

### Step 1: Identify the Variations

First, identify all the variations you want to switch between. For the lead synth, these were:

| Key | Name | Description |
|-----|------|-------------|
| `epiano` | Electric Piano | Warm jazz chords with GM electric piano |
| `organ` | Pipe Organ | Wide octave spreads, cathedral sound |
| `techno` | Techno Supersaw | Aggressive supersaw arpeggios |
| `original` | Original Sawtooth | Syncopated with full effects chain |
| `piano` | Piano | Gentle Steinway intro |

### Step 2: Add a Helper Function to `launchdarkly.mjs`

Add a function that reads a flag and returns the appropriate pattern from a variations map.

**File:** `website/src/repl/launchdarkly.mjs`

```javascript
/**
 * Returns a lead arrangement pattern based on a LaunchDarkly flag value.
 * @param {string} flagKey - The LD flag key containing the variation name
 * @param {string} defaultVariation - Fallback variation name if flag fails
 * @param {Object} variations - Map of variation names to pattern factories
 * @returns {Pattern} The selected pattern
 */
export const getLeadArrangement = (flagKey, defaultVariation, variations) => {
  let cachedVariationKey = null;
  let cachedPattern = null;
  
  return new Pattern((state) => {
    const variationKey = flags[flagKey] ?? defaultVariation;
    const patternFactory = variations[variationKey] ?? variations[defaultVariation];
    
    if (!patternFactory) {
      console.warn(`[LaunchDarkly] No variation found for '${variationKey}'`);
      return [];
    }
    
    if (variationKey !== cachedVariationKey) {
      cachedVariationKey = variationKey;
      cachedPattern = typeof patternFactory === 'function' ? patternFactory() : patternFactory;
    }
    
    return cachedPattern.query(state);
  });
};
```

### Step 3: Register the Function in the REPL Context

Import and register the function on `globalThis` so it's available in the Strudel REPL.

**File:** `website/src/repl/useReplContext.jsx`

1. Add to imports:
```javascript
import { initLaunchDarkly, flag, setcpmFlag, getLeadArrangement } from './launchdarkly.mjs';
```

2. Register in prebake:
```javascript
globalThis.flag = flag;
globalThis.setcpmFlag = setcpmFlag;
globalThis.getLeadArrangement = getLeadArrangement;  // Add this line
```

### Step 4: Create the LaunchDarkly Flag

Create a string flag in LaunchDarkly with variations for each instrument configuration.

**Flag Details:**
- **Project:** `dj-toggle`
- **Key:** `leadArrangement`
- **Type:** String (multivariate)
- **Client-side availability:** Enabled (`usingEnvironmentId: true`)

**Variations:**
| Value | Name | Description |
|-------|------|-------------|
| `techno` | Techno Supersaw | Aggressive supersaw arpeggios (LEAD 3) |
| `epiano` | Electric Piano | Warm jazz chords (LEAD 1) |
| `organ` | Pipe Organ | Cathedral pipe organ (LEAD 2) |
| `original` | Original Sawtooth | Syncopated with effects (LEAD 4) |
| `piano` | Piano | Steinway intro (LEAD 5) |

**Defaults:**
- On variation: `techno` (index 0)
- Off variation: `original` (index 3)

### Step 5: Refactor the Instrument Config File

Convert the commented-out variations into a variations map, then use the helper function.

**File:** `instrument_configs/current_config.txt`

**Before:**
```javascript
// // LEAD 1: ELECTRIC PIANO
// let lead_synth = arrange(...)

// // LEAD 2: ORGAN  
// let lead_synth = arrange(...)

// LEAD 3: TECHNO
let lead_synth = arrange(...)
```

**After:**
```javascript
// Define all lead variations as a map of pattern factories
const leadVariations = {
  epiano: () => arrange(
    [3, "<[[e3,b3,g3,e4] [- - [e3,b3,g3,e4] - - ]] [ - [f3,c4,a3,f4]]>*2"],
    [1, "<[g3,d4,b3,g4] [a3,e4,c4,a4]>*2"]
  ).note().sound("gm_epiano1").gain(1.5).release(.4),

  organ: () => arrange(
    [3, "<[e1,e2,e3,b3,g3,e4] [f1,f2,f3,c4,a2,f4]>*2"],
    [1, "<[g1,g2,g3,d4,b3,g5] [a1,a2,a3,e4,c4,a4]>*2"]
  ).note().sound("pipeorgan_loud").gain(2).release(.4),

  techno: () => arrange(
    [3, "<0 4 0 9 7>*16".scale("[e:minor f:major]")],
    [1, "<0 4 0 9 7>*16".scale("[g:major a:minor]")]
  ).note().sound("supersaw"),

  original: () => arrange(
    [3, "<[[e3,b3] - c4 -] [e3 - f3 c4] [- c4 a4 -] [- - - -]>*4"],
    [1, "<[- - [g3,b3] -] [g3 - a3 c4] [- c4 c5 -] [c4 - g4 -]>*4"]
  ).note().sound("sawtooth")
    .attack(0).decay(.25).sustain(0).release(.3)
    .lpf(300).lpq(0).lpenv(3).lpa(0).lpd(.15).lps(0)
    .delay(.2).delaytime(.25).delayfeedback(.1),

  piano: () => arrange(
    [3, "<[e4 b3 g3 e3] [e4 b3 g3 e3] [e4 c4 a3 f3] [e4 c4 a3 f3]>*4"],
    [1, "<[g3,b3,d4] [g3 - a3 c4] [- c4 c5 -] [c4 - g4 -]>*4"]
  ).note().sound("steinway")
    .attack(0).decay(.25).sustain(3).release(.3)
    .delay(.2).delaytime(.25).delayfeedback(.1)
};

// Dynamically selected via LaunchDarkly 'leadArrangement' flag
let lead_synth = getLeadArrangement('leadArrangement', 'original', leadVariations);
```

### Step 6: Update the Integration Guide

Add documentation for the new feature in `LAUNCHDARKLY_INTEGRATION_GUIDE.md`:
- Add a new section explaining the feature
- Update the Custom Methods Summary table
- Include usage examples

---

## Applying This Pattern to Other Instruments

To add flag-controlled variations for other instruments (bass, drums, etc.):

### Option A: Reuse `getLeadArrangement` (Recommended for full pattern switching)

The function is generic enough to work with any instrument:

```javascript
const bassVariations = {
  punchy: () => arrange(...).note().sound("gm_synth_bass_1"),
  deep: () => arrange(...).note().sound("gm_synth_bass_2"),
  sub: () => arrange(...).note().sound("sine").lpf(200)
};

let bass = getLeadArrangement('bassArrangement', 'punchy', bassVariations);
```

Then create a corresponding `bassArrangement` flag in LaunchDarkly.

### Option B: Use existing methods for simpler changes

For changes that only affect sound/effects (not the note pattern):

```javascript
// Use .drumKit() for drum bank + effects
$: s("bd!4, [- sd - sd], [hh*8]")
  .drumKit('drumKitSettings', { bank: 'RolandTR808' })

// Use .bassSound() for bass sound + filter
$: note("e2 f2 g2 a2")
  .bassSound('bassSoundSettings', { sound: 'gm_synth_bass_2', lpf: 1800 })

// Use .leadSound() for lead sound + filter
$: note("c4 e4 g4 b4")
  .leadSound('leadSynthSettings', { sound: 'supersaw' })
```

---

## Key Files Modified

| File | Changes |
|------|---------|
| `website/src/repl/launchdarkly.mjs` | Added `getLeadArrangement()` function |
| `website/src/repl/useReplContext.jsx` | Imported and registered `getLeadArrangement` on globalThis |
| `instrument_configs/current_config.txt` | Refactored lead variations into a map |
| `LAUNCHDARKLY_INTEGRATION_GUIDE.md` | Added Section 10 documenting the feature |

---

## Naming Conventions

| Instrument | Flag Key | Variations Map Variable | Status |
|------------|----------|------------------------|--------|
| Lead | `leadArrangement` | `leadVariations` | ✅ Done |
| Bass | `bassArrangement` | `bassVariations` | ✅ Done |
| Drums | `drumArrangement` | `drumVariations` | ✅ Done |
| Melody | `melodyArrangement` | `melodyVariations` | Pending |

---

## Troubleshooting

### "X is not defined" error
- Ensure the function is exported from `launchdarkly.mjs`
- Ensure the function is imported in `useReplContext.jsx`
- Ensure the function is registered on `globalThis` in the prebake section
- Restart/reload the REPL after making changes

### Flag changes not taking effect
- Check that the flag is enabled in LaunchDarkly
- Check that client-side availability is enabled (`usingEnvironmentId: true`)
- Verify the flag key matches exactly (case-sensitive)
- Check browser console for LaunchDarkly errors
