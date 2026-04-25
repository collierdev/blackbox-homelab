import { useState } from 'react';
import { Thermometer, Minus, Plus, Flame, Snowflake, Fan } from 'lucide-react';
import type { HAClimate } from '../../types';

interface ClimateCardProps {
  climate: HAClimate;
  onSetTemperature: (entityId: string, temperature: number) => Promise<boolean>;
}

export function ClimateCard({ climate, onSetTemperature }: ClimateCardProps) {
  const [loading, setLoading] = useState(false);
  const friendlyName = climate.attributes.friendly_name || climate.entity_id.split('.')[1];
  const currentTemp = climate.attributes.current_temperature;
  const targetTemp = climate.attributes.temperature;
  const hvacAction = climate.attributes.hvac_action;
  const minTemp = climate.attributes.min_temp || 10;
  const maxTemp = climate.attributes.max_temp || 35;
  const isOff = climate.state === 'off';

  const getActionIcon = () => {
    switch (hvacAction) {
      case 'heating':
        return <Flame className="w-4 h-4 text-[#ffb4ab]" />;
      case 'cooling':
        return <Snowflake className="w-4 h-4 text-primary" />;
      case 'fan':
        return <Fan className="w-4 h-4 text-primary" />;
      default:
        return null;
    }
  };

  const handleTempChange = async (delta: number) => {
    if (!targetTemp) return;
    const newTemp = Math.min(maxTemp, Math.max(minTemp, targetTemp + delta));
    setLoading(true);
    await onSetTemperature(climate.entity_id, newTemp);
    setLoading(false);
  };

  return (
    <div className="bg-surface-container-high border border-white/5 rounded-lg p-4 hover:bg-surface-bright transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOff ? 'bg-surface-container-low text-on-surface-variant' : 'bg-[#ffb4ab]/20 text-[#ffb4ab]'}`}>
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-sm text-on-surface">{friendlyName}</h3>
            <p className="text-xs text-on-surface-variant flex items-center gap-1">
              {currentTemp !== undefined ? `${currentTemp}°` : 'N/A'}
              {getActionIcon()}
              <span className="capitalize">{hvacAction || climate.state}</span>
            </p>
          </div>
        </div>
      </div>

      {!isOff && targetTemp !== undefined && (
        <div className="flex items-center justify-between bg-surface-container-low rounded-lg p-3">
          <button
            onClick={() => handleTempChange(-0.5)}
            disabled={loading || targetTemp <= minTemp}
            className="p-2 rounded-lg bg-surface hover:bg-surface-container-high disabled:opacity-50 transition-colors text-on-surface"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="text-center">
            <span className="text-2xl font-bold text-on-surface font-['Plus_Jakarta_Sans']">{targetTemp}°</span>
            <p className="text-xs text-on-surface-variant">Target</p>
          </div>
          <button
            onClick={() => handleTempChange(0.5)}
            disabled={loading || targetTemp >= maxTemp}
            className="p-2 rounded-lg bg-surface hover:bg-surface-container-high disabled:opacity-50 transition-colors text-on-surface"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {isOff && (
        <div className="text-center text-on-surface-variant text-sm py-2">
          Thermostat is off
        </div>
      )}
    </div>
  );
}
