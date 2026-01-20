import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Event } from '../../types';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

interface MonthViewProps {
  events: Event[];
  currentDate: Date;
  onEventClick: (eventId: string) => void;
  onEventDoubleClick: (eventId: string) => void;
  onNewEvent: (date?: Date) => void;
}

export default function MonthView({
  events,
  currentDate,
  onEventClick,
  onEventDoubleClick,
  onNewEvent,
}: MonthViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions on resize
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

  // Render calendar with d3
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 40, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Calculate calendar grid
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weeks = Math.ceil(allDays.length / 7);
    const cellWidth = innerWidth / 7;
    const cellHeight = innerHeight / weeks;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Weekday headers
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    g.selectAll('.weekday-header')
      .data(weekdays)
      .join('text')
      .attr('class', 'weekday-header')
      .attr('x', (_d, i) => i * cellWidth + cellWidth / 2)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .attr('font-size', '14px')
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
        if (!isSameMonth(d, currentDate)) return 'var(--color-day-outside)';
        if (isSameDay(d, new Date())) return 'var(--color-day-today)';
        return 'var(--color-day-normal)';
      })
      .attr('stroke', 'var(--color-border)')
      .attr('stroke-width', 1)
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .on('click', function(event, d) {
        if (event.detail === 1) {
          // Single click - new event
          onNewEvent(d);
        }
      });

    // Day numbers
    cells
      .append('text')
      .attr('x', 8)
      .attr('y', 20)
      .attr('fill', d => {
        if (!isSameMonth(d, currentDate)) return 'var(--color-text-muted)';
        if (isSameDay(d, new Date())) return 'var(--color-text-today)';
        return 'var(--color-text-normal)';
      })
      .attr('font-size', '14px')
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

      // Show up to 4 event dots
      const visibleEvents = dayEvents.slice(0, 4);
      const hasMore = dayEvents.length > 4;

      visibleEvents.forEach((event, eventIndex) => {
        const eventGroup = g.append('g')
          .attr('transform', `translate(${x + 8},${y + 35 + eventIndex * 18})`)
          .style('cursor', 'pointer')
          .on('click', function(e) {
            e.stopPropagation();
            onEventClick(event.id);
          })
          .on('dblclick', function(e) {
            e.stopPropagation();
            onEventDoubleClick(event.id);
          });

        // Event indicator dot
        eventGroup
          .append('circle')
          .attr('cx', 3)
          .attr('cy', 6)
          .attr('r', 3)
          .attr('fill', event.color || '#3b82f6');

        // Event title (truncated)
        eventGroup
          .append('text')
          .attr('x', 10)
          .attr('y', 9)
          .attr('fill', 'var(--color-text-normal)')
          .attr('font-size', '11px')
          .text(event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title);
      });

      // "+N more" indicator
      if (hasMore) {
        g.append('text')
          .attr('x', x + 8)
          .attr('y', y + 35 + visibleEvents.length * 18 + 9)
          .attr('fill', 'var(--color-text-muted)')
          .attr('font-size', '10px')
          .text(`+${dayEvents.length - 4} more`)
          .style('cursor', 'pointer')
          .on('click', () => onNewEvent(day));
      }
    });

    // Add CSS custom properties for theming
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --color-day-normal: rgba(255, 255, 255, 0.5);
        --color-day-outside: rgba(0, 0, 0, 0.02);
        --color-day-today: rgba(59, 130, 246, 0.1);
        --color-border: rgba(0, 0, 0, 0.1);
        --color-text-normal: rgba(0, 0, 0, 0.87);
        --color-text-muted: rgba(0, 0, 0, 0.4);
        --color-text-today: rgb(59, 130, 246);
      }
      .dark {
        --color-day-normal: rgba(0, 0, 0, 0.2);
        --color-day-outside: rgba(0, 0, 0, 0.4);
        --color-day-today: rgba(59, 130, 246, 0.2);
        --color-border: rgba(255, 255, 255, 0.1);
        --color-text-normal: rgba(255, 255, 255, 0.87);
        --color-text-muted: rgba(255, 255, 255, 0.4);
        --color-text-today: rgb(96, 165, 250);
      }
    `;
    if (!document.getElementById('calendar-month-view-styles')) {
      style.id = 'calendar-month-view-styles';
      document.head.appendChild(style);
    }

  }, [dimensions, currentDate, events, onEventClick, onEventDoubleClick, onNewEvent]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="text-gray-900 dark:text-white"
      />
    </div>
  );
}
