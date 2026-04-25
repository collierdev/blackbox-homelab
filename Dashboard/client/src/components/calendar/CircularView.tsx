import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Event } from '../../types';
import { startOfYear, endOfYear, eachDayOfInterval, format, isSameDay, getMonth, getDayOfYear } from 'date-fns';

interface CircularViewProps {
  events: Event[];
  currentDate: Date;
  onEventClick: (eventId: string) => void;
  onEventDoubleClick: (eventId: string) => void;
  onNewEvent: (date?: Date) => void;
}

export default function CircularView({
  events,
  currentDate,
  onEventClick,
  onEventDoubleClick,
  onNewEvent,
}: CircularViewProps) {
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
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;

    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });
    const daysInYear = allDays.length;

    const g = svg.append('g');

    // Year title
    g.append('text')
      .attr('x', centerX)
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '24px')
      .attr('font-weight', '700')
      .text(format(currentDate, 'yyyy'));

    // Month arcs
    const months = Array.from({ length: 12 }, (_, i) => i);
    const monthColors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308',
      '#84cc16', '#22c55e', '#10b981', '#14b8a6',
      '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1'
    ];

    months.forEach((month) => {
      const monthDays = allDays.filter(d => getMonth(d) === month);
      const startDay = getDayOfYear(monthDays[0]) - 1;
      const endDay = getDayOfYear(monthDays[monthDays.length - 1]);

      const startAngle = (startDay / daysInYear) * 2 * Math.PI - Math.PI / 2;
      const endAngle = (endDay / daysInYear) * 2 * Math.PI - Math.PI / 2;

      const arc = d3.arc()
        .innerRadius(radius - 30)
        .outerRadius(radius)
        .startAngle(startAngle)
        .endAngle(endAngle);

      g.append('path')
        .attr('d', arc as any)
        .attr('transform', `translate(${centerX},${centerY})`)
        .attr('fill', monthColors[month])
        .attr('opacity', 0.3);

      // Month label
      const midAngle = (startAngle + endAngle) / 2;
      const labelRadius = radius + 20;
      const labelX = centerX + labelRadius * Math.cos(midAngle);
      const labelY = centerY + labelRadius * Math.sin(midAngle);

      g.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#c2c6d6')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .text(format(new Date(currentDate.getFullYear(), month, 1), 'MMM'));
    });

    // Day dots
    allDays.forEach((day, index) => {
      const angle = (index / daysInYear) * 2 * Math.PI - Math.PI / 2;
      const dayEvents = events.filter(e => isSameDay(new Date(e.startDateTime), day));
      const isToday = isSameDay(day, new Date());

      // Inner radius varies based on event count
      const eventRadius = dayEvents.length > 0 ? radius - 60 - (dayEvents.length * 3) : radius - 60;
      const x = centerX + eventRadius * Math.cos(angle);
      const y = centerY + eventRadius * Math.sin(angle);

      const dayGroup = g.append('g')
        .style('cursor', 'pointer')
        .on('click', function() {
          if (dayEvents.length > 0) {
            onEventClick(dayEvents[0].id);
          } else {
            onNewEvent(day);
          }
        });

      dayGroup
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', isToday ? 5 : dayEvents.length > 0 ? 4 : 2)
        .attr('fill', () => {
          if (isToday) return '#ffb4ab';
          if (dayEvents.length > 0) return dayEvents[0].color || '#adc6ff';
          return '#243356';
        })
        .attr('opacity', dayEvents.length > 0 ? 1 : 0.4);

      // Hover tooltip
      dayGroup
        .append('title')
        .text(() => {
          let text = format(day, 'MMM d, yyyy');
          if (dayEvents.length > 0) {
            text += `\n${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}`;
            dayEvents.slice(0, 3).forEach(e => {
              text += `\n• ${e.title}`;
            });
            if (dayEvents.length > 3) {
              text += `\n+${dayEvents.length - 3} more`;
            }
          }
          return text;
        });
    });

    // Current date indicator
    const today = new Date();
    if (today.getFullYear() === currentDate.getFullYear()) {
      const todayIndex = getDayOfYear(today) - 1;
      const angle = (todayIndex / daysInYear) * 2 * Math.PI - Math.PI / 2;

      // Line from center to current day
      const lineEnd = radius + 30;
      g.append('line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', centerX + lineEnd * Math.cos(angle))
        .attr('y2', centerY + lineEnd * Math.sin(angle))
        .attr('stroke', '#ffb4ab')
        .attr('stroke-width', 2)
        .attr('opacity', 0.7);
    }

    // Center info
    const totalEvents = events.filter(e => {
      const eventYear = new Date(e.startDateTime).getFullYear();
      return eventYear === currentDate.getFullYear();
    }).length;

    g.append('text')
      .attr('x', centerX)
      .attr('y', centerY - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '36px')
      .attr('font-weight', '700')
      .text(totalEvents);

    g.append('text')
      .attr('x', centerX)
      .attr('y', centerY + 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8892a4')
      .attr('font-size', '14px')
      .text(`event${totalEvents !== 1 ? 's' : ''} this year`);

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
