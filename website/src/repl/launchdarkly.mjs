
import * as LDClient from 'launchdarkly-js-client-sdk';
import { Pattern, stack, pure } from '@strudel/core';
import { mini } from '@strudel/mini';

let ldClient;
const flags = {};

export const initLaunchDarkly = async (clientId) => {
  if (ldClient) {
    return;
  }

  const user = {
    key: 'strudel-user-' + Math.floor(Math.random() * 10000),
    anonymous: true,
  };

  ldClient = LDClient.initialize(clientId, user);

  return new Promise((resolve, reject) => {
    ldClient.on('ready', () => {
      Object.assign(flags, ldClient.allFlags());
      resolve();
    });

    ldClient.on('change', (settings) => {
      Object.keys(settings).forEach((key) => {
        flags[key] = settings[key].current;
      });
    });
    
    ldClient.on('failed', (err) => {
      console.error('[LaunchDarkly] Failed to initialize:', err);
      reject(err);
    });
  });
};

// Check if a string value contains mini-notation pattern syntax
const hasMiniNotation = (value) => {
  if (typeof value !== 'string') return false;
  // Check for common mini-notation patterns: <> for slowcat, [] for grouping, * for speed, etc.
  return /[<>\[\]*!@,]/.test(value);
};

export const flag = (key, defaultValue) => {
    // Cache for parsed mini-notation patterns - allows dynamic updates
    let cachedValue = null;
    let cachedPattern = null;
    
    // Create a dynamic pattern that re-evaluates on each query
    // This allows flag changes to take effect immediately
    return new Pattern((state) => {
      const value = flags[key] ?? defaultValue;
      
      // If value contains mini-notation, parse it as a pattern
      if (hasMiniNotation(value)) {
        // Re-parse only if the value changed (for efficiency)
        if (value !== cachedValue) {
          try {
            cachedPattern = mini(value);
            cachedValue = value;
          } catch (e) {
            console.error(`[LaunchDarkly] Failed to parse mini-notation for flag '${key}':`, e);
            return pure(value).query(state);
          }
        }
        return cachedPattern.query(state);
      }
      
      // For plain values, return a pure pattern query
      return pure(value).query(state);
    });
};

/**
 * Creates polyphonic (layered) speed multiplication from a flag value.
 * Unlike fast() which sequences speeds, this stacks multiple copies of the pattern
 * running at different speeds simultaneously - equivalent to mini-notation *[a,b,c].
 * 
 * @name polySpeed
 * @param {string} flagKey - The LaunchDarkly flag key containing speed value(s)
 * @param {number|number[]} defaultValue - Default speed(s) if flag is not set
 * @example
 * // Flag 'melodySpeed' can be a single number (16) or array ([16, 4])
 * // Single number: plays at that speed
 * // Array: creates polyphonic layers at each speed (like *[16,4] in mini-notation)
 * 
 * n("<0 2 0 4 9 7>")
 *   .polySpeed('melodySpeed', [16, 4])
 *   .scale("<g:minor eb:major bb:major d:major>")
 *   ._punchcard()
 */
Pattern.prototype.polySpeed = function(flagKey, defaultValue = 1) {
  // We need to return a pattern that dynamically reads the flag
  // and applies the appropriate speed transformation
  const self = this;
  
  // Get the current flag value
  const getValue = () => flags[flagKey] ?? defaultValue;
  
  // Create a new pattern that queries the flag and builds the appropriate structure
  return new Pattern((state) => {
    const speeds = getValue();
    
    // If it's an array, create polyphonic layers (stack)
    if (Array.isArray(speeds)) {
      if (speeds.length === 0) {
        return self.query(state);
      }
      // Stack multiple copies at different speeds
      const layeredPattern = stack(...speeds.map(speed => self._fast(speed)));
      return layeredPattern.query(state);
    }
    
    // If it's a single number, just apply fast
    return self._fast(speeds).query(state);
  });
};

/**
 * Applies drum kit settings from a LaunchDarkly flag.
 * The flag is read dynamically, so changes take effect on the next trigger.
 * The flag should be a JSON object with:
 *   - bank: string - the drum machine bank name (e.g., 'RolandTR808', 'RolandTR909')
 *   - gain: number - optional gain multiplier (default: 1)
 *   - delay: number - optional delay amount (0-1)
 *   - room: number - optional reverb room size (0-1)
 *   - any other Strudel audio effect properties
 * 
 * @name drumKit
 * @param {string} flagKey - The LaunchDarkly flag key to read drum kit settings from
 * @param {Object} defaultValue - Default settings if flag is not set: { bank: 'RolandTR808', gain: 1 }
 * @example
 * s("bd sd [~ bd] sd, hh*8")
 *   .drumKit('drum-kit-settings')
 */
Pattern.prototype.drumKit = function(flagKey, defaultValue = { bank: 'RolandTR808', gain: 1 }) {
  return this.withHap((hap) => {
    const flagValue = flags[flagKey] ?? defaultValue;
    
    // If flagValue is a string, try to parse it as JSON
    let parsedValue = flagValue;
    if (typeof flagValue === 'string') {
      try {
        parsedValue = JSON.parse(flagValue);
      } catch (e) {
        // Keep as-is if not valid JSON
      }
    }
    
    const { bank = 'RolandTR808', gain = 1, ...effects } = parsedValue;
    
    return hap.withValue((v) => ({
      ...v,
      ...effects,
      bank,
      gain: (v.gain ?? 1) * gain,
    }));
  });
};

/**
 * Applies bass sound settings from a LaunchDarkly flag.
 * The flag is read dynamically, so changes take effect on the next trigger.
 * The flag should be a JSON object with:
 *   - sound: string - the sound/synth name (e.g., 'gm_synth_bass_2', 'sawtooth')
 *   - lpf: number - optional low-pass filter cutoff frequency
 *   - gain: number - optional gain multiplier (default: 1)
 * 
 * @name bassSound
 * @param {string} flagKey - The LaunchDarkly flag key to read bass sound settings from
 * @param {Object} defaultValue - Default settings if flag is not set
 * @example
 * note("e2 f2 g2 a2")
 *   .bassSound('bass-sound-settings')
 */
Pattern.prototype.bassSound = function(flagKey, defaultValue = { sound: 'gm_synth_bass_2', lpf: 1800, gain: 1 }) {
  return this.withHap((hap) => {
    const flagValue = flags[flagKey] ?? defaultValue;
    
    // If flagValue is a string, try to parse it as JSON
    let parsedValue = flagValue;
    if (typeof flagValue === 'string') {
      try {
        parsedValue = JSON.parse(flagValue);
      } catch (e) {
        // Keep as-is if not valid JSON
      }
    }
    
    const { sound = 'gm_synth_bass_2', lpf, gain = 1, ...otherEffects } = parsedValue;
    
    return hap.withValue((v) => {
      const newValue = {
        ...v,
        ...otherEffects,
        s: sound,
        gain: (v.gain ?? 1) * gain,
      };
      
      if (lpf !== undefined) {
        newValue.lpf = lpf;
      }
      
      return newValue;
    });
  });
};

/**
 * Applies lead synth settings from a LaunchDarkly flag.
 * The flag is read dynamically, so changes take effect on the next trigger.
 * The flag should be a JSON object with:
 *   - sound: string - the sound/synth name (e.g., 'sawtooth', 'gm_lead_2_sawtooth')
 *   - lpf: number - optional low-pass filter cutoff frequency
 *   - lpq: number - optional filter resonance
 *   - gain: number - optional gain multiplier (default: 1)
 * 
 * @name leadSound
 * @param {string} flagKey - The LaunchDarkly flag key to read lead synth settings from
 * @param {Object} defaultValue - Default settings if flag is not set
 * @example
 * note("c4 e4 g4 b4")
 *   .leadSound('lead-synth-settings')
 */
Pattern.prototype.leadSound = function(flagKey, defaultValue = { sound: 'sawtooth', lpf: 300, lpq: 0, gain: 1 }) {
  return this.withHap((hap) => {
    const flagValue = flags[flagKey] ?? defaultValue;
    
    // If flagValue is a string, try to parse it as JSON
    let parsedValue = flagValue;
    if (typeof flagValue === 'string') {
      try {
        parsedValue = JSON.parse(flagValue);
      } catch (e) {
        // Keep as-is if not valid JSON
      }
    }
    
    const { sound = 'sawtooth', lpf, lpq, gain = 1, ...otherEffects } = parsedValue;
    
    return hap.withValue((v) => {
      const newValue = {
        ...v,
        ...otherEffects,
        s: sound,
        gain: (v.gain ?? 1) * gain,
      };
      
      if (lpf !== undefined) {
        newValue.lpf = lpf;
      }
      if (lpq !== undefined) {
        newValue.lpq = lpq;
      }
      
      return newValue;
    });
  });
};

/**
 * Conditionally enables or disables a pattern based on a LaunchDarkly flag.
 * When the flag is truthy, the pattern plays normally.
 * When the flag is falsy, the pattern is silenced.
 * 
 * @name toggle
 * @param {string} flagKey - The LaunchDarkly flag key (should be a boolean flag)
 * @param {boolean} defaultValue - Default state if flag is not set (default: true = enabled)
 * @example
 * // Enable/disable drums with a boolean flag 'drums-enabled'
 * $: s("bd!4, [- sd - sd], [hh*8]")
 *   .drumKit('drum-kit-settings', { bank: 'RolandTR808' })
 *   .toggle('drums-enabled', true)
 *   ._scope()
 * 
 * // Enable/disable melody
 * $: n("<0 2 0 3 4 0 9 8>")
 *   .polySpeed('melodySpeed', 16)
 *   .scale(flag('scale', '<g:minor>'))
 *   .toggle('melody-enabled', true)
 *   ._punchcard()
 */
Pattern.prototype.toggle = function(flagKey, defaultValue = true) {
  const self = this;
  return new Pattern((state) => {
    const enabled = flags[flagKey] ?? defaultValue;
    if (enabled) {
      return self.query(state);
    }
    return []; // Return no haps (silence)
  });
};

// Track registered tempo flag listeners to prevent duplicates
const tempoListeners = new Map();

/**
 * Sets the global tempo (cycles per minute) from a LaunchDarkly flag.
 * The tempo updates reactively when the flag value changes.
 * 
 * @name setcpmFlag
 * @param {string} flagKey - The LaunchDarkly flag key containing the tempo value
 * @param {number} defaultValue - Default tempo value if flag is not set (default: 100)
 * @param {number} divisor - Optional divisor to convert flag value to CPM (default: 1)
 *                           Use 4 for 4/4 time when storing BPM in the flag
 * @returns {Pattern} Returns silence (like setcpm)
 * @example
 * // Set tempo from a flag storing CPM directly
 * setcpmFlag('globalTempo', 25) // 25 CPM
 * 
 * // Set tempo from a flag storing BPM, with divisor for 4/4 time
 * setcpmFlag('globalTempo', 110, 4) // Flag stores 110 BPM, converts to 27.5 CPM
 * 
 * // Common BPM to CPM conversions (4/4 time):
 * // 80 BPM = 20 CPM, 100 BPM = 25 CPM, 110 BPM = 27.5 CPM, 120 BPM = 30 CPM
 */
export const setcpmFlag = (flagKey, defaultValue = 100, divisor = 1) => {
  // Get initial value and set tempo
  const getValue = () => {
    const value = flags[flagKey] ?? defaultValue;
    // Parse if string (in case flag returns string)
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue / divisor;
  };
  
  // Apply initial tempo
  const applyTempo = () => {
    const cpm = getValue();
    if (typeof globalThis.setcpm === 'function') {
      globalThis.setcpm(cpm);
    } else if (typeof globalThis.setCpm === 'function') {
      globalThis.setCpm(cpm);
    } else {
      console.warn('[LaunchDarkly] setcpm not available - tempo change deferred');
    }
  };
  
  // Apply tempo immediately
  applyTempo();
  
  // Set up reactive listener if not already registered for this flag
  if (!tempoListeners.has(flagKey)) {
    const listener = () => {
      applyTempo();
    };
    tempoListeners.set(flagKey, listener);
    
    // Hook into the LaunchDarkly change event if client is available
    if (ldClient) {
      ldClient.on('change', (settings) => {
        if (settings[flagKey]) {
          listener();
        }
      });
    }
  }
  
  // Return silence like setcpm does
  return pure(0).withValue(() => ({}));
};

/**
 * Returns a lead arrangement pattern based on a LaunchDarkly flag value.
 * The flag should contain a string key matching a registered variation name.
 * This enables dynamic switching between pre-defined lead synth arrangements.
 * 
 * @name getLeadArrangement
 * @param {string} flagKey - The LaunchDarkly flag key containing the variation name
 * @param {string} defaultVariation - Fallback variation name if flag is not set or invalid
 * @param {Object} variations - Map of variation names to pattern factories (functions returning patterns)
 * @returns {Pattern} The selected lead arrangement pattern
 * @example
 * // Define lead variations as a map of pattern factories
 * const leadVariations = {
 *   techno: () => arrange(
 *     [3, "<0 4 0 9 7>*16".scale("[e:minor f:major]")],
 *     [1, "<0 4 0 9 7>*16".scale("[g:major a:minor]")]
 *   ).note().sound("supersaw"),
 *   
 *   original: () => arrange(
 *     [3, "<[[e3,b3] - c4 -] [e3 - f3 c4] [- c4 a4 -] [- - - -]>*4"],
 *     [1, "<[- - [g3,b3] -] [g3 - a3 c4] [- c4 c5 -] [c4 - g4 -]>*4"]
 *   ).note().sound("sawtooth")
 * };
 * 
 * // Use flag to dynamically select the lead arrangement
 * let lead_synth = getLeadArrangement('leadArrangement', 'original', leadVariations);
 */
export const getLeadArrangement = (flagKey, defaultVariation, variations) => {
  // Cache to avoid recreating patterns on every query
  let cachedVariationKey = null;
  let cachedPattern = null;
  
  return new Pattern((state) => {
    const variationKey = flags[flagKey] ?? defaultVariation;
    
    // Get the pattern factory for the requested variation, fallback to default
    const patternFactory = variations[variationKey] ?? variations[defaultVariation];
    
    if (!patternFactory) {
      console.warn(`[LaunchDarkly] No variation found for '${variationKey}' or default '${defaultVariation}'`);
      return [];
    }
    
    // Only recreate the pattern if the variation changed
    if (variationKey !== cachedVariationKey) {
      cachedVariationKey = variationKey;
      // Call the factory function to get the pattern
      cachedPattern = typeof patternFactory === 'function' ? patternFactory() : patternFactory;
    }
    
    return cachedPattern.query(state);
  });
};
