import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Event } from '../../types';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths } from 'date-fns';

interface TwoMonthViewProps {
  events: Event[];
  currentDate: Date;
  onEventClick: (eventId: string) => void;
  onEventDoubleClick: (eventId: string) => void;
  onNewEvent: (date?: Date) => void;
}

export default function TwoMonthView({
  events,
  currentDate,
  onEventClick,
  onEventDoubleClick,
  onNewEvent,
}: TwoMonthViewProps) {
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
    const margin = { top: 60, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const monthWidth = innerWidth / 2 - 10;

    const renderMonth = (monthDate: Date, xOffset: number) => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

      const weeks = Math.ceil(allDays.length / 7);
      const cellWidth = monthWidth / 7;
      const cellHeight = innerHeight / weeks;

      const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left + xOffset},${margin.top})`);

      // Month title
      g.append('text')
        .attr('x', monthWidth / 2)
        .attr('y', -30)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e2e8f0')
        .attr('font-size', '18px')
        .attr('font-weight', '700')
        .text(format(monthDate, 'MMMM yyyy'));

      // Weekday headers
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      g.selectAll('.weekday-header')
        .data(weekdays)
        .join('text')
        .attr('class', 'weekday-header')
        .attr('x', (_d, i) => i * cellWidth + cellWidth / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#8892a4')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .text(d => d);

      // Day cells
      const cells = g
        .selectAll('.day-cell')
        .data(allDays)
        .join('g')
        .attr('class', 'day-cell')
        .attr('transform', (_d, i) => {
          const row = Math.floor(i / 7);
          const col = i % 7;
          return `translate(${col * cellWidth},${row * cellHeight})`;
        });

      // Cell backgrounds
      cells
        .append('rect')
        .attr('width', cellWidth - 2)
        .attr('height', cellHeight - 2)
        .attr('x', 1)
        .attr('y', 1)
        .attr('fill', d => {
          if (!isSameMonth(d, monthDate)) return '#0f1a2e';
          if (isSameDay(d, new Date())) return 'rgba(173, 198, 255, 0.1)';
          return '#162040';
        })
        .attr('stroke', '#243356')
        .attr('stroke-width', 0.5)
        .attr('rx', 3)
        .style('cursor', 'pointer')
        .on('click', function(_event, d) {
          onNewEvent(d);
        });

      // Day numbers
      cells
        .append('text')
        .attr('x', 6)
        .attr('y', 16)
        .attr('fill', d => {
          if (!isSameMonth(d, monthDate)) return '#8892a4';
          if (isSameDay(d, new Date())) return '#adc6ff';
          return '#e2e8f0';
        })
        .attr('font-size', '12px')
        .attr('font-weight', d => isSameDay(d, new Date()) ? '700' : '500')
        .text(d => format(d, 'd'))
        .style('pointer-events', 'none');

      // Event dots
      allDays.forEach((day, dayIndex) => {
        const dayEvents = events.filter(e => {
          const eventDate = new Date(e.startDateTime);
          return isSameDay(eventDate, day);
        });

        const row = Math.floor(dayIndex / 7);
        const col = dayIndex % 7;
        const x = col * cellWidth;
        const y = row * cellHeight;

        // Show up to 3 dots
        const visibleEvents = dayEvents.slice(0, 3);
        visibleEvents.forEach((event, eventIndex) => {
          g.append('circle')
            .attr('cx', x + 8 + eventIndex * 10)
            .attr('cy', y + cellHeight - 10)
            .attr('r', 3)
            .attr('fill', event.color || '#3b82f6')
            .style('cursor', 'pointer')
            .on('click', function(e) {
              e.stopPropagation();
              onEventClick(event.id);
            })
            .on('dblclick', function(e) {
              e.stopPropagation();
              onEventDoubleClick(event.id);
            });
        });

        if (dayEvents.length > 3) {
          g.append('text')
            .attr('x', x + 38)
            .attr('y', y + cellHeight - 7)
            .attr('fill', '#8892a4')
            .attr('font-size', '9px')
            .text(`+${dayEvents.length - 3}`)
            .style('cursor', 'pointer')
            .on('click', () => onNewEvent(day));
        }
      });
    };

    // Render first month
    renderMonth(currentDate, 0);

    // Render second month
    const nextMonth = addMonths(currentDate, 1);
    renderMonth(nextMonth, monthWidth + 20);

  }, [dimensions, currentDate, events, onEventClick, onEventDoubleClick, onNewEvent]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ background: '#0f1a2e' }}
      />
    </div>
  );
}
