import { useState } from 'react';
import type { CalendarView } from '../../types';
import CalendarHeader from './CalendarHeader';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import TwoMonthView from './TwoMonthView';
import CircularView from './CircularView';
import EventModal from './EventModal';
import EventForm from './EventForm';
import { useSocket } from '../../hooks/useSocket';

export default function Calendar() {
  const { events, projects, createEvent, updateEvent, deleteEvent, completeEvent } = useSocket();
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string | null>(null);

  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null;
  const editingEvent = editingEventId ? events.find(e => e.id === editingEventId) : null;

  const filteredEvents = selectedProjectFilter
    ? events.filter(e => e.projectId === selectedProjectFilter)
    : events;

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    switch (currentView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case '2month':
        newDate.setMonth(newDate.getMonth() - 2);
        break;
      case 'circular':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    switch (currentView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case '2month':
        newDate.setMonth(newDate.getMonth() + 2);
        break;
      case 'circular':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const handleEventDoubleClick = (eventId: string) => {
    setEditingEventId(eventId);
    setIsEventFormOpen(true);
  };

  const handleNewEvent = (date?: Date) => {
    setEditingEventId(null);
    setIsEventFormOpen(true);
    if (date) {
      // Set initial date for new event
    }
  };

  const handleCloseEventModal = () => {
    setSelectedEventId(null);
  };

  const handleCloseEventForm = () => {
    setIsEventFormOpen(false);
    setEditingEventId(null);
  };

  const handleSaveEvent = async (eventData: any) => {
    try {
      if (editingEventId) {
        await updateEvent(editingEventId, eventData);
      } else {
        await createEvent(eventData);
      }
      handleCloseEventForm();
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      handleCloseEventModal();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleCompleteEvent = async (eventId: string) => {
    try {
      await completeEvent(eventId);
    } catch (error) {
      console.error('Failed to complete event:', error);
    }
  };

  const renderView = () => {
    const commonProps = {
      events: filteredEvents,
      currentDate,
      onEventClick: handleEventClick,
      onEventDoubleClick: handleEventDoubleClick,
      onNewEvent: handleNewEvent,
    };

    switch (currentView) {
      case 'month':
        return <MonthView {...commonProps} />;
      case 'week':
        return <WeekView {...commonProps} />;
      case 'day':
        return <DayView {...commonProps} />;
      case '2month':
        return <TwoMonthView {...commonProps} />;
      case 'circular':
        return <CircularView {...commonProps} />;
      default:
        return <MonthView {...commonProps} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <CalendarHeader
        currentView={currentView}
        currentDate={currentDate}
        onViewChange={setCurrentView}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
        onNewEvent={() => handleNewEvent()}
        projects={projects}
        selectedProjectFilter={selectedProjectFilter}
        onProjectFilterChange={setSelectedProjectFilter}
      />

      <div className="flex-1 overflow-hidden">
        {renderView()}
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          projects={projects}
          onClose={handleCloseEventModal}
          onEdit={() => {
            handleCloseEventModal();
            setEditingEventId(selectedEvent.id);
            setIsEventFormOpen(true);
          }}
          onDelete={() => handleDeleteEvent(selectedEvent.id)}
          onComplete={() => handleCompleteEvent(selectedEvent.id)}
        />
      )}

      {isEventFormOpen && (
        <EventForm
          event={editingEvent || undefined}
          projects={projects}
          onClose={handleCloseEventForm}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  );
}
