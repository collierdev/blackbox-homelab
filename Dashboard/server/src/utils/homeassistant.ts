import { getHAConfig } from '../config/homeassistant';

export interface HAEntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface HAServiceCall {
  domain: string;
  service: string;
  service_data?: Record<string, unknown>;
  target?: {
    entity_id: string | string[];
  };
}

// Get authorization headers
function getHeaders(): Record<string, string> {
  const config = getHAConfig();
  return {
    'Authorization': `Bearer ${config.token}`,
    'Content-Type': 'application/json'
  };
}

// Check if Home Assistant is connected
export async function checkConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const config = getHAConfig();
    if (!config.token) {
      return { connected: false, error: 'No access token configured' };
    }

    const response = await fetch(`${config.url}/api/`, {
      headers: getHeaders()
    });

    if (response.ok) {
      return { connected: true };
    }

    return { connected: false, error: `HTTP ${response.status}` };
  } catch (error) {
    return { connected: false, error: String(error) };
  }
}

// Get all entity states
export async function getAllStates(): Promise<HAEntityState[]> {
  const config = getHAConfig();
  const response = await fetch(`${config.url}/api/states`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error(`Failed to get states: ${response.status}`);
  }

  return response.json() as Promise<HAEntityState[]>;
}

// Get entities filtered by domain
export async function getEntitiesByDomain(domain: string): Promise<HAEntityState[]> {
  const states = await getAllStates();
  return states.filter(entity => entity.entity_id.startsWith(`${domain}.`));
}

// Get single entity state
export async function getEntityState(entityId: string): Promise<HAEntityState> {
  const config = getHAConfig();
  const response = await fetch(`${config.url}/api/states/${entityId}`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error(`Failed to get entity ${entityId}: ${response.status}`);
  }

  return response.json() as Promise<HAEntityState>;
}

// Call a Home Assistant service
export async function callService(
  domain: string,
  service: string,
  entityId?: string,
  serviceData?: Record<string, unknown>
): Promise<HAEntityState[]> {
  const config = getHAConfig();

  const body: Record<string, unknown> = { ...serviceData };
  if (entityId) {
    body.entity_id = entityId;
  }

  const response = await fetch(`${config.url}/api/services/${domain}/${service}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Failed to call service ${domain}.${service}: ${response.status}`);
  }

  return response.json() as Promise<HAEntityState[]>;
}

// Toggle an entity (works for lights, switches, etc.)
export async function toggleEntity(entityId: string): Promise<HAEntityState[]> {
  const domain = entityId.split('.')[0];
  return callService(domain, 'toggle', entityId);
}

// Turn on an entity
export async function turnOn(entityId: string, data?: Record<string, unknown>): Promise<HAEntityState[]> {
  const domain = entityId.split('.')[0];
  return callService(domain, 'turn_on', entityId, data);
}

// Turn off an entity
export async function turnOff(entityId: string): Promise<HAEntityState[]> {
  const domain = entityId.split('.')[0];
  return callService(domain, 'turn_off', entityId);
}

// Light-specific functions
export async function setLightBrightness(entityId: string, brightness: number): Promise<HAEntityState[]> {
  return callService('light', 'turn_on', entityId, { brightness });
}

export async function setLightColor(entityId: string, rgbColor: [number, number, number]): Promise<HAEntityState[]> {
  return callService('light', 'turn_on', entityId, { rgb_color: rgbColor });
}

// Set light color using HS (Hue/Saturation) - common for smart bulbs
export async function setLightHSColor(entityId: string, hsColor: [number, number]): Promise<HAEntityState[]> {
  return callService('light', 'turn_on', entityId, { hs_color: hsColor });
}

// Set light color temperature in Kelvin
export async function setLightColorTemp(entityId: string, kelvin: number): Promise<HAEntityState[]> {
  return callService('light', 'turn_on', entityId, { color_temp_kelvin: kelvin });
}

// Set light effect
export async function setLightEffect(entityId: string, effect: string): Promise<HAEntityState[]> {
  return callService('light', 'turn_on', entityId, { effect });
}

// Control multiple lights at once (for fixtures)
export async function setMultipleLightsBrightness(entityIds: string[], brightness: number): Promise<HAEntityState[]> {
  const results: HAEntityState[] = [];
  for (const entityId of entityIds) {
    const result = await setLightBrightness(entityId, brightness);
    results.push(...result);
  }
  return results;
}

export async function setMultipleLightsColor(entityIds: string[], rgbColor: [number, number, number]): Promise<HAEntityState[]> {
  const results: HAEntityState[] = [];
  for (const entityId of entityIds) {
    const result = await setLightColor(entityId, rgbColor);
    results.push(...result);
  }
  return results;
}

export async function setMultipleLightsHSColor(entityIds: string[], hsColor: [number, number]): Promise<HAEntityState[]> {
  const results: HAEntityState[] = [];
  for (const entityId of entityIds) {
    const result = await setLightHSColor(entityId, hsColor);
    results.push(...result);
  }
  return results;
}

export async function setMultipleLightsColorTemp(entityIds: string[], kelvin: number): Promise<HAEntityState[]> {
  const results: HAEntityState[] = [];
  for (const entityId of entityIds) {
    const result = await setLightColorTemp(entityId, kelvin);
    results.push(...result);
  }
  return results;
}

export async function toggleMultipleLights(entityIds: string[]): Promise<HAEntityState[]> {
  const results: HAEntityState[] = [];
  for (const entityId of entityIds) {
    const result = await toggleEntity(entityId);
    results.push(...result);
  }
  return results;
}

export async function turnOnMultipleLights(entityIds: string[]): Promise<HAEntityState[]> {
  const results: HAEntityState[] = [];
  for (const entityId of entityIds) {
    const result = await turnOn(entityId);
    results.push(...result);
  }
  return results;
}

export async function turnOffMultipleLights(entityIds: string[]): Promise<HAEntityState[]> {
  const results: HAEntityState[] = [];
  for (const entityId of entityIds) {
    const result = await turnOff(entityId);
    results.push(...result);
  }
  return results;
}

// Climate-specific functions
export async function setClimateTemperature(entityId: string, temperature: number): Promise<HAEntityState[]> {
  return callService('climate', 'set_temperature', entityId, { temperature });
}

export async function setClimateHvacMode(entityId: string, hvacMode: string): Promise<HAEntityState[]> {
  return callService('climate', 'set_hvac_mode', entityId, { hvac_mode: hvacMode });
}

// Media player functions
export async function mediaPlayPause(entityId: string): Promise<HAEntityState[]> {
  return callService('media_player', 'media_play_pause', entityId);
}

export async function mediaPlay(entityId: string): Promise<HAEntityState[]> {
  return callService('media_player', 'media_play', entityId);
}

export async function mediaPause(entityId: string): Promise<HAEntityState[]> {
  return callService('media_player', 'media_pause', entityId);
}

export async function mediaStop(entityId: string): Promise<HAEntityState[]> {
  return callService('media_player', 'media_stop', entityId);
}

export async function mediaNext(entityId: string): Promise<HAEntityState[]> {
  return callService('media_player', 'media_next_track', entityId);
}

export async function mediaPrevious(entityId: string): Promise<HAEntityState[]> {
  return callService('media_player', 'media_previous_track', entityId);
}

export async function setMediaVolume(entityId: string, volumeLevel: number): Promise<HAEntityState[]> {
  return callService('media_player', 'volume_set', entityId, { volume_level: volumeLevel });
}

export async function setMediaSource(entityId: string, source: string): Promise<HAEntityState[]> {
  return callService('media_player', 'select_source', entityId, { source });
}

// Get grouped entities by type for dashboard display
export async function getGroupedEntities(): Promise<{
  lights: HAEntityState[];
  switches: HAEntityState[];
  climate: HAEntityState[];
  media_players: HAEntityState[];
  cameras: HAEntityState[];
}> {
  const states = await getAllStates();

  return {
    lights: states.filter(e => e.entity_id.startsWith('light.')),
    switches: states.filter(e => e.entity_id.startsWith('switch.')),
    climate: states.filter(e => e.entity_id.startsWith('climate.')),
    media_players: states.filter(e => e.entity_id.startsWith('media_player.')),
    cameras: states.filter(e => e.entity_id.startsWith('camera.'))
  };
}
