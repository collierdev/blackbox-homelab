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
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'cooling':
        return <Snowflake className="w-4 h-4 text-blue-500" />;
      case 'fan':
        return <Fan className="w-4 h-4 text-cyan-500" />;
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
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOff ? 'bg-muted text-muted-foreground' : 'bg-orange-500/20 text-orange-500'}`}>
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-sm">{friendlyName}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {currentTemp !== undefined ? `${currentTemp}°` : 'N/A'}
              {getActionIcon()}
              <span className="capitalize">{hvacAction || climate.state}</span>
            </p>
          </div>
        </div>
      </div>

      {!isOff && targetTemp !== undefined && (
        <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
          <button
            onClick={() => handleTempChange(-0.5)}
            disabled={loading || targetTemp <= minTemp}
            className="p-2 rounded-lg bg-background hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="text-center">
            <span className="text-2xl font-bold">{targetTemp}°</span>
            <p className="text-xs text-muted-foreground">Target</p>
          </div>
          <button
            onClick={() => handleTempChange(0.5)}
            disabled={loading || targetTemp >= maxTemp}
            className="p-2 rounded-lg bg-background hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {isOff && (
        <div className="text-center text-muted-foreground text-sm py-2">
          Thermostat is off
        </div>
      )}
    </div>
  );
}
