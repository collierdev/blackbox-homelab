import type { HALight } from '../types';

/**
 * Color modes that support full color (hue/saturation) control.
 * These modes can all accept rgb_color via Home Assistant's automatic conversion.
 */
export const COLOR_CAPABLE_MODES = ['hs', 'xy', 'rgb', 'rgbw', 'rgbww'] as const;

/**
 * Color modes that support color temperature (white spectrum) control.
 */
export const COLOR_TEMP_MODES = ['color_temp'] as const;

/**
 * Check if a light supports full color control.
 */
export function supportsColor(light: HALight): boolean {
  return light.attributes.supported_color_modes?.some(
    mode => (COLOR_CAPABLE_MODES as readonly string[]).includes(mode)
  ) ?? false;
}

/**
 * Check if a light supports color temperature control.
 */
export function supportsColorTemperature(light: HALight): boolean {
  return light.attributes.supported_color_modes?.includes('color_temp') ?? false;
}

/**
 * Get the current color mode of a light.
 */
export function getCurrentColorMode(light: HALight): string | undefined {
  return light.attributes.color_mode;
}

/**
 * Check if the light is currently in a color mode (vs white/temp mode).
 */
export function isInColorMode(light: HALight): boolean {
  const mode = light.attributes.color_mode;
  return mode ? (COLOR_CAPABLE_MODES as readonly string[]).includes(mode) : false;
}
