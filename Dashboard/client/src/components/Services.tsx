import { useState, useEffect } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import type { ServiceInfo } from '../types';
import { ServiceCard } from './ServiceCard';

export function Services() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const handleAction = async (id: string, type: string, action: 'start' | 'stop' | 'restart') => {
    try {
      const res = await fetch(`/api/services/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Action failed');
      }

      setTimeout(fetchServices, 1000);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Failed to ${action} service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleNotesUpdate = async (name: string, notes: string) => {
    try {
      const res = await fetch(`/api/services/${name}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });

      if (!res.ok) {
        throw new Error('Failed to save notes');
      }

      fetchServices();
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    }
  };

  const handleIconUpload = async (name: string, icon: string | null) => {
    try {
      const res = await fetch(`/api/services/${name}/icon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icon })
      });

      if (!res.ok) {
        throw new Error('Failed to upload icon');
      }

      fetchServices();
    } catch (error) {
      console.error('Error uploading icon:', error);
      alert('Failed to upload icon');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Services</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-secondary rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 bg-secondary rounded w-24" />
                  <div className="h-3 bg-secondary rounded w-16" />
                </div>
              </div>
              <div className="h-8 bg-secondary rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Services</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-accent rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            onAction={handleAction}
            onNotesUpdate={handleNotesUpdate}
            onIconUpload={handleIconUpload}
          />
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No services found
        </div>
      )}
    </div>
  );
}
