import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Event } from '../../types';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, addHours } from 'date-fns';

interface WeekViewProps {
  events: Event[];
  currentDate: Date;
  onEventClick: (eventId: string) => void;
  onEventDoubleClick: (eventId: string) => void;
  onNewEvent: (date?: Date) => void;
}

export default function WeekView({
  events,
  currentDate,
  onEventClick,
  onEventDoubleClick,
  onNewEvent,
}: WeekViewProps) {
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
    const margin = { top: 60, right: 20, bottom: 20, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayWidth = innerWidth / 7;
    const hourHeight = innerHeight / 24;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Day headers
    weekDays.forEach((day, i) => {
      const isToday = isSameDay(day, new Date());

      g.append('rect')
        .attr('x', i * dayWidth)
        .attr('y', -40)
        .attr('width', dayWidth - 2)
        .attr('height', 35)
        .attr('fill', isToday ? 'rgba(173, 198, 255, 0.15)' : 'transparent')
        .attr('rx', 4);

      g.append('text')
        .attr('x', i * dayWidth + dayWidth / 2)
        .attr('y', -22)
        .attr('text-anchor', 'middle')
        .attr('fill', isToday ? '#adc6ff' : '#c2c6d6')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .text(format(day, 'EEE'));

      g.append('text')
        .attr('x', i * dayWidth + dayWidth / 2)
        .attr('y', -8)
        .attr('text-anchor', 'middle')
        .attr('fill', isToday ? '#adc6ff' : '#e2e8f0')
        .attr('font-size', '18px')
        .attr('font-weight', isToday ? '700' : '500')
        .text(format(day, 'd'));
    });

    // Hour labels
    hours.forEach((hour) => {
      g.append('text')
        .attr('x', -10)
        .attr('y', hour * hourHeight + 12)
        .attr('text-anchor', 'end')
        .attr('fill', '#8892a4')
        .attr('font-size', '11px')
        .text(`${hour.toString().padStart(2, '0')}:00`);
    });

    // Grid lines
    hours.forEach((hour) => {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', hour * hourHeight)
        .attr('y2', hour * hourHeight)
        .attr('stroke', '#243356')
        .attr('stroke-width', hour === 0 ? 1.5 : 0.5)
        .attr('opacity', 1);
    });

    weekDays.forEach((_, i) => {
      g.append('line')
        .attr('x1', i * dayWidth)
        .attr('x2', i * dayWidth)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#243356')
        .attr('stroke-width', 0.5)
        .attr('opacity', 1);
    });

    // Click areas for creating events
    weekDays.forEach((day, dayIndex) => {
      hours.forEach((hour) => {
        g.append('rect')
          .attr('x', dayIndex * dayWidth + 1)
          .attr('y', hour * hourHeight)
          .attr('width', dayWidth - 2)
          .attr('height', hourHeight)
          .attr('fill', 'transparent')
          .style('cursor', 'pointer')
          .on('click', function() {
            const eventDate = addHours(day, hour);
            onNewEvent(eventDate);
          });
      });
    });

    // Event blocks
    events.forEach((event) => {
      const eventStart = new Date(event.startDateTime);
      const eventEnd = new Date(event.endDateTime);

      // Find which day this event belongs to
      const dayIndex = weekDays.findIndex(day => isSameDay(day, eventStart));
      if (dayIndex === -1) return; // Event not in this week

      // Calculate position and size
      const startHour = eventStart.getHours() + eventStart.getMinutes() / 60;
      const endHour = eventEnd.getHours() + eventEnd.getMinutes() / 60;
      const duration = endHour - startHour;

      const x = dayIndex * dayWidth + 2;
      const y = startHour * hourHeight;
      const w = dayWidth - 4;
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
        .attr('height', Math.max(h, 20))
        .attr('fill', event.color || '#3b82f6')
        .attr('opacity', 0.8)
        .attr('rx', 4);

      eventGroup
        .append('text')
        .attr('x', x + 6)
        .attr('y', y + 14)
        .attr('fill', 'white')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .text(event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title);

      if (h > 30) {
        eventGroup
          .append('text')
          .attr('x', x + 6)
          .attr('y', y + 28)
          .attr('fill', 'white')
          .attr('font-size', '10px')
          .attr('opacity', 0.9)
          .text(`${format(eventStart, 'h:mm a')} - ${format(eventEnd, 'h:mm a')}`);
      }
    });

  }, [dimensions, currentDate, events, onEventClick, onEventDoubleClick, onNewEvent]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={Math.max(dimensions.height, 1000)}
        style={{ background: '#0f1a2e' }}
      />
    </div>
  );
}
