
import React, { useEffect, useState } from 'react';
import DailyEntryForm from '../components/DailyEntryForm';
import { ArbeitsEintrag } from '../types';
import { getEntryByDate, createDefaultEntry } from '../services/storageService';

interface Props {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onSaveStatusChange: (status: 'saved' | 'unsaved' | 'saving') => void;
}

const CalendarPage: React.FC<Props> = ({ selectedDate, onDateSelect, onSaveStatusChange }) => {
  const [currentEntry, setCurrentEntry] = useState<ArbeitsEintrag | null>(null);

  const loadEntry = async (date: string) => {
    const entry = await getEntryByDate(date);
    if (entry) {
      setCurrentEntry(entry);
    } else {
      setCurrentEntry(createDefaultEntry(date));
    }
  };

  useEffect(() => {
    loadEntry(selectedDate);
  }, [selectedDate]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateSelect(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateSelect(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    onDateSelect(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Main Content Area with Scroll */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {currentEntry ? (
          <DailyEntryForm 
            entry={currentEntry} 
            onSave={() => loadEntry(selectedDate)} 
            onPrev={handlePrevDay}
            onNext={handleNextDay}
            onToday={handleToday}
            onDateSelect={onDateSelect}
            onSaveStatusChange={onSaveStatusChange}
          />
        ) : (
          <div className="flex justify-center items-center h-full flex-col gap-4 text-marien-400">
             <div className="w-12 h-12 border-4 border-marien-500 border-t-transparent rounded-full animate-spin"></div>
             <p>Lade Daten...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;