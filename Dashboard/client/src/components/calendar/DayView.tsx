import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Event } from '../../types';
import { format, isSameDay, addHours } from 'date-fns';

interface DayViewProps {
  events: Event[];
  currentDate: Date;
  onEventClick: (eventId: string) => void;
  onEventDoubleClick: (eventId: string) => void;
  onNewEvent: (date?: Date) => void;
}

export default function DayView({
  events,
  currentDate,
  onEventClick,
  onEventDoubleClick,
  onNewEvent,
}: DayViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 40, right: 40, bottom: 20, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const hourHeight = innerHeight / 24;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Day header
    const isToday = isSameDay(currentDate, new Date());

    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .attr('fill', isToday ? 'rgb(59, 130, 246)' : 'currentColor')
      .attr('font-size', '20px')
      .attr('font-weight', '700')
      .text(format(currentDate, 'EEEE, MMMM d, yyyy'));

    // Hour labels and grid lines
    hours.forEach((hour) => {
      // Hour label
      g.append('text')
        .attr('x', -10)
        .attr('y', hour * hourHeight + 12)
        .attr('text-anchor', 'end')
        .attr('fill', 'currentColor')
        .attr('font-size', '12px')
        .attr('opacity', 0.7)
        .text(`${hour.toString().padStart(2, '0')}:00`);

      // Grid line
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', hour * hourHeight)
        .attr('y2', hour * hourHeight)
        .attr('stroke', 'currentColor')
        .attr('stroke-width', hour === 0 ? 2 : 0.5)
        .attr('opacity', hour === 0 ? 0.3 : 0.1);

      // Half-hour line
      if (hour < 23) {
        g.append('line')
          .attr('x1', 0)
          .attr('x2', innerWidth)
          .attr('y1', hour * hourHeight + hourHeight / 2)
          .attr('y2', hour * hourHeight + hourHeight / 2)
          .attr('stroke', 'currentColor')
          .attr('stroke-width', 0.5)
          .attr('opacity', 0.05);
      }
    });

    // Click areas for creating events
    hours.forEach((hour) => {
      g.append('rect')
        .attr('x', 0)
        .attr('y', hour * hourHeight)
        .attr('width', innerWidth)
        .attr('height', hourHeight)
        .attr('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('click', function() {
          const eventDate = addHours(currentDate, hour);
          onNewEvent(eventDate);
        });
    });

    // Current time indicator (if today)
    if (isToday) {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const y = currentHour * hourHeight;

      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', y)
        .attr('y2', y)
        .attr('stroke', 'rgb(239, 68, 68)')
        .attr('stroke-width', 2);

      g.append('circle')
        .attr('cx', 0)
        .attr('cy', y)
        .attr('r', 6)
        .attr('fill', 'rgb(239, 68, 68)');

      g.append('text')
        .attr('x', innerWidth - 10)
        .attr('y', y - 8)
        .attr('text-anchor', 'end')
        .attr('fill', 'rgb(239, 68, 68)')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .text(format(now, 'h:mm a'));
    }

    // Filter events for this day
    const dayEvents = events.filter(e => isSameDay(new Date(e.startDateTime), currentDate));

    // Detect overlapping events
    const eventSlots: { event: Event; column: number; totalColumns: number }[] = [];
    dayEvents.forEach((event) => {
      const startTime = new Date(event.startDateTime);
      const endTime = new Date(event.endDateTime);

      // Find overlapping events
      const overlapping = eventSlots.filter(slot => {
        const slotStart = new Date(slot.event.startDateTime);
        const slotEnd = new Date(slot.event.endDateTime);
        return (startTime < slotEnd && endTime > slotStart);
      });

      const usedColumns = overlapping.map(s => s.column);
      let column = 0;
      while (usedColumns.includes(column)) {
        column++;
      }

      const totalColumns = Math.max(column + 1, ...overlapping.map(s => s.totalColumns));
      overlapping.forEach(slot => {
        slot.totalColumns = totalColumns;
      });

      eventSlots.push({ event, column, totalColumns });
    });

    // Draw events
    eventSlots.forEach(({ event, column, totalColumns }) => {
      const eventStart = new Date(event.startDateTime);
      const eventEnd = new Date(event.endDateTime);

      const startHour = eventStart.getHours() + eventStart.getMinutes() / 60;
      const endHour = eventEnd.getHours() + eventEnd.getMinutes() / 60;
      const duration = endHour - startHour;

      const columnWidth = innerWidth / totalColumns;
      const x = column * columnWidth + 4;
      const y = startHour * hourHeight;
      const w = columnWidth - 8;
      const h = duration * hourHeight;

      const eventGroup = g.append('g')
        .style('cursor', 'pointer')
        .on('click', function(e) {
          e.stopPropagation();
          onEventClick(event.id);
        })
        .on('dblclick', function(e) {
          e.stopPropagation();
          onEventDoubleClick(event.id);
        });

      eventGroup
        .append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', w)
        .attr('height', Math.max(h, 30))
        .attr('fill', event.color || '#3b82f6')
        .attr('opacity', 0.85)
        .attr('rx', 6);

      eventGroup
        .append('text')
        .attr('x', x + 8)
        .attr('y', y + 16)
        .attr('fill', 'white')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .text(event.title.length > 25 ? event.title.substring(0, 25) + '...' : event.title);

      if (h > 35) {
        eventGroup
          .append('text')
          .attr('x', x + 8)
          .attr('y', y + 32)
          .attr('fill', 'white')
          .attr('font-size', '11px')
          .attr('opacity', 0.95)
          .text(`${format(eventStart, 'h:mm a')} - ${format(eventEnd, 'h:mm a')}`);
      }

      if (h > 50 && event.location) {
        eventGroup
          .append('text')
          .attr('x', x + 8)
          .attr('y', y + 46)
          .attr('fill', 'white')
          .attr('font-size', '10px')
          .attr('opacity', 0.85)
          .text(event.location.length > 30 ? event.location.substring(0, 30) + '...' : event.location);
      }
    });

  }, [dimensions, currentDate, events, onEventClick, onEventDoubleClick, onNewEvent]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={Math.max(dimensions.height, 1200)}
        className="text-gray-900 dark:text-white"
      />
    </div>
  );
}
