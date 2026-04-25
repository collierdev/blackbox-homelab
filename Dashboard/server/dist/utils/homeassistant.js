"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkConnection = checkConnection;
exports.getAllStates = getAllStates;
exports.getEntitiesByDomain = getEntitiesByDomain;
exports.getEntityState = getEntityState;
exports.callService = callService;
exports.toggleEntity = toggleEntity;
exports.turnOn = turnOn;
exports.turnOff = turnOff;
exports.setLightBrightness = setLightBrightness;
exports.setLightColor = setLightColor;
exports.setLightHSColor = setLightHSColor;
exports.setLightColorTemp = setLightColorTemp;
exports.setLightEffect = setLightEffect;
exports.setMultipleLightsBrightness = setMultipleLightsBrightness;
exports.setMultipleLightsColor = setMultipleLightsColor;
exports.setMultipleLightsHSColor = setMultipleLightsHSColor;
exports.setMultipleLightsColorTemp = setMultipleLightsColorTemp;
exports.toggleMultipleLights = toggleMultipleLights;
exports.turnOnMultipleLights = turnOnMultipleLights;
exports.turnOffMultipleLights = turnOffMultipleLights;
exports.setClimateTemperature = setClimateTemperature;
exports.setClimateHvacMode = setClimateHvacMode;
exports.mediaPlayPause = mediaPlayPause;
exports.mediaPlay = mediaPlay;
exports.mediaPause = mediaPause;
exports.mediaStop = mediaStop;
exports.mediaNext = mediaNext;
exports.mediaPrevious = mediaPrevious;
exports.setMediaVolume = setMediaVolume;
exports.setMediaSource = setMediaSource;
exports.getGroupedEntities = getGroupedEntities;
const homeassistant_1 = require("../config/homeassistant");
// Get authorization headers
function getHeaders() {
    const config = (0, homeassistant_1.getHAConfig)();
    return {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
    };
}
// Check if Home Assistant is connected
async function checkConnection() {
    try {
        const config = (0, homeassistant_1.getHAConfig)();
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
    }
    catch (error) {
        return { connected: false, error: String(error) };
    }
}
// Get all entity states
async function getAllStates() {
    const config = (0, homeassistant_1.getHAConfig)();
    const response = await fetch(`${config.url}/api/states`, {
        headers: getHeaders()
    });
    if (!response.ok) {
        throw new Error(`Failed to get states: ${response.status}`);
    }
    return response.json();
}
// Get entities filtered by domain
async function getEntitiesByDomain(domain) {
    const states = await getAllStates();
    return states.filter(entity => entity.entity_id.startsWith(`${domain}.`));
}
// Get single entity state
async function getEntityState(entityId) {
    const config = (0, homeassistant_1.getHAConfig)();
    const response = await fetch(`${config.url}/api/states/${entityId}`, {
        headers: getHeaders()
    });
    if (!response.ok) {
        throw new Error(`Failed to get entity ${entityId}: ${response.status}`);
    }
    return response.json();
}
// Call a Home Assistant service
async function callService(domain, service, entityId, serviceData) {
    const config = (0, homeassistant_1.getHAConfig)();
    const body = { ...serviceData };
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
    return response.json();
}
// Toggle an entity (works for lights, switches, etc.)
async function toggleEntity(entityId) {
    const domain = entityId.split('.')[0];
    return callService(domain, 'toggle', entityId);
}
// Turn on an entity
async function turnOn(entityId, data) {
    const domain = entityId.split('.')[0];
    return callService(domain, 'turn_on', entityId, data);
}
// Turn off an entity
async function turnOff(entityId) {
    const domain = entityId.split('.')[0];
    return callService(domain, 'turn_off', entityId);
}
// Light-specific functions
async function setLightBrightness(entityId, brightness) {
    return callService('light', 'turn_on', entityId, { brightness });
}
async function setLightColor(entityId, rgbColor) {
    return callService('light', 'turn_on', entityId, { rgb_color: rgbColor });
}
// Set light color using HS (Hue/Saturation) - common for smart bulbs
async function setLightHSColor(entityId, hsColor) {
    return callService('light', 'turn_on', entityId, { hs_color: hsColor });
}
// Set light color temperature in Kelvin
async function setLightColorTemp(entityId, kelvin) {
    return callService('light', 'turn_on', entityId, { color_temp_kelvin: kelvin });
}
// Set light effect
async function setLightEffect(entityId, effect) {
    return callService('light', 'turn_on', entityId, { effect });
}
// Control multiple lights at once (for fixtures)
async function setMultipleLightsBrightness(entityIds, brightness) {
    const results = [];
    for (const entityId of entityIds) {
        const result = await setLightBrightness(entityId, brightness);
        results.push(...result);
    }
    return results;
}
async function setMultipleLightsColor(entityIds, rgbColor) {
    const results = [];
    for (const entityId of entityIds) {
        const result = await setLightColor(entityId, rgbColor);
        results.push(...result);
    }
    return results;
}
async function setMultipleLightsHSColor(entityIds, hsColor) {
    const results = [];
    for (const entityId of entityIds) {
        const result = await setLightHSColor(entityId, hsColor);
        results.push(...result);
    }
    return results;
}
async function setMultipleLightsColorTemp(entityIds, kelvin) {
    const results = [];
    for (const entityId of entityIds) {
        const result = await setLightColorTemp(entityId, kelvin);
        results.push(...result);
    }
    return results;
}
async function toggleMultipleLights(entityIds) {
    const results = [];
    for (const entityId of entityIds) {
        const result = await toggleEntity(entityId);
        results.push(...result);
    }
    return results;
}
async function turnOnMultipleLights(entityIds) {
    const results = [];
    for (const entityId of entityIds) {
        const result = await turnOn(entityId);
        results.push(...result);
    }
    return results;
}
async function turnOffMultipleLights(entityIds) {
    const results = [];
    for (const entityId of entityIds) {
        const result = await turnOff(entityId);
        results.push(...result);
    }
    return results;
}
// Climate-specific functions
async function setClimateTemperature(entityId, temperature) {
    return callService('climate', 'set_temperature', entityId, { temperature });
}
async function setClimateHvacMode(entityId, hvacMode) {
    return callService('climate', 'set_hvac_mode', entityId, { hvac_mode: hvacMode });
}
// Media player functions
async function mediaPlayPause(entityId) {
    return callService('media_player', 'media_play_pause', entityId);
}
async function mediaPlay(entityId) {
    return callService('media_player', 'media_play', entityId);
}
async function mediaPause(entityId) {
    return callService('media_player', 'media_pause', entityId);
}
async function mediaStop(entityId) {
    return callService('media_player', 'media_stop', entityId);
}
async function mediaNext(entityId) {
    return callService('media_player', 'media_next_track', entityId);
}
async function mediaPrevious(entityId) {
    return callService('media_player', 'media_previous_track', entityId);
}
async function setMediaVolume(entityId, volumeLevel) {
    return callService('media_player', 'volume_set', entityId, { volume_level: volumeLevel });
}
async function setMediaSource(entityId, source) {
    return callService('media_player', 'select_source', entityId, { source });
}
// Get grouped entities by type for dashboard display
async function getGroupedEntities() {
    const states = await getAllStates();
    return {
        lights: states.filter(e => e.entity_id.startsWith('light.')),
        switches: states.filter(e => e.entity_id.startsWith('switch.')),
        climate: states.filter(e => e.entity_id.startsWith('climate.')),
        media_players: states.filter(e => e.entity_id.startsWith('media_player.')),
        cameras: states.filter(e => e.entity_id.startsWith('camera.'))
    };
}
//# sourceMappingURL=homeassistant.js.map