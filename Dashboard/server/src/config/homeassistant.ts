export interface HomeAssistantConfig {
  url: string;
  token: string;
  wsUrl: string;
}

// Default token - can be overridden via HA_TOKEN environment variable
const DEFAULT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIzMTg0YzM2ZWQ2MzY0ZWQxYjc3NzEyZGM4NmU2YzZkZCIsImlhdCI6MTc2ODMwMjQ0OSwiZXhwIjoyMDgzNjYyNDQ5fQ.nQaNonXLZglM_v5NG86471MRD7NVA-JlRXYX35uRoxA';

export function getHAConfig(): HomeAssistantConfig {
  const url = process.env.HA_URL || 'http://192.168.50.39:8123';
  return {
    url,
    token: process.env.HA_TOKEN || DEFAULT_TOKEN,
    wsUrl: url.replace('http', 'ws') + '/api/websocket'
  };
}
