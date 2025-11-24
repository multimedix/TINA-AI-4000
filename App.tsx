
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import CalendarPage from './pages/CalendarPage';
import ProtocolPage from './pages/ProtocolPage';
import InfoPage from './pages/InfoPage';
import MoodPage from './pages/MoodPage';
import Login from './pages/Login';
import { checkDatabaseConnection } from './services/storageService';

type SaveStatus = 'saved' | 'unsaved' | 'saving';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [page, setPage] = useState<'calendar' | 'protocol' | 'info' | 'mood'>('calendar');
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; type: 'FIREBASE' | 'LOCAL' } | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  useEffect(() => {
    const checkDB = async () => {
      const status = await checkDatabaseConnection();
      setDbStatus(status);
    };
    checkDB();
  }, []);

  if (!hasStarted) {
    return <Login onLoginSuccess={() => setHasStarted(true)} />;
  }

  return (
    <div className="bg-gray-100 min-h-screen font-sans text-base-800 flex flex-col">
       <Navbar 
         currentPage={page} 
         onNavigate={(p) => setPage(p as any)} 
         selectedDate={selectedDate}
         onDateSelect={setSelectedDate}
         saveStatus={saveStatus}
       />
       
       {/* Main Content with bottom padding for Nav */}
       <main className="flex-1 relative overflow-hidden h-full pb-28 md:pb-0">
         {page === 'calendar' && (
           <CalendarPage 
             selectedDate={selectedDate} 
             onDateSelect={setSelectedDate}
             onSaveStatusChange={setSaveStatus}
           />
         )}
         {page === 'protocol' && (
           <ProtocolPage 
             selectedDate={selectedDate} 
             onDateSelect={setSelectedDate}
           />
         )}
         {page === 'info' && <InfoPage />}
         {page === 'mood' && <MoodPage selectedDate={selectedDate} />}
       </main>

       {/* Mobile/Tablet Bottom Navigation */}
       <div className="md:hidden">
          <BottomNav 
            currentPage={page} 
            onNavigate={(p) => setPage(p as any)} 
          />
       </div>
    </div>
  );
};

export default App;
