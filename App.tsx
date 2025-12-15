import React, { useState, useEffect } from 'react';
import { Participant } from './types';
import Snowfall from './components/Snowfall';
import AddParticipantModal from './components/AddParticipantModal';
import ParticipantCard from './components/ParticipantCard';
import GiftDisplayModal from './components/GiftDisplayModal';
import { Plus, CloudOff } from 'lucide-react';
import { subscribeToParticipants, saveParticipantToDb, isFirebaseConfigured } from './services/firebase';

const App: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | undefined>(undefined);

  // Initial Load & Real-time Subscription
  useEffect(() => {
    const unsubscribe = subscribeToParticipants((data) => {
      setParticipants(data);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveParticipant = async (p: Participant) => {
    await saveParticipantToDb(p);
    
    if (!isFirebaseConfigured) {
       setParticipants(prev => {
          const idx = prev.findIndex(x => x.id === p.id);
          if (idx >= 0) {
             const newArr = [...prev];
             newArr[idx] = p;
             return newArr;
          }
          return [...prev, p];
       });
    }

    setIsAddModalOpen(false);
    setEditingParticipant(undefined);
  };

  const handleStartEditing = (participant: Participant) => {
    setSelectedParticipant(null); // Close display modal
    setEditingParticipant(participant); // Set data for edit modal
    setIsAddModalOpen(true); // Open edit modal
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingParticipant(undefined);
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5980?auto=format&fit=crop&q=80')] bg-cover bg-center bg-fixed text-slate-800 font-sans relative overflow-x-hidden">
      
      {/* Overlay for readability */}
      <div className="fixed inset-0 bg-blue-950/60 pointer-events-none z-0" />
      
      <Snowfall />
      
      {/* Configuration Warning Banner */}
      {!isFirebaseConfigured && (
        <div className="relative z-50 bg-amber-500/90 text-white text-center py-2 px-4 text-xs md:text-sm font-bold shadow-lg backdrop-blur-sm flex items-center justify-center gap-2">
          <CloudOff className="w-4 h-4" />
          <span>Modo Local: Os dados estão salvos apenas no seu navegador. Configure o Firebase para sincronizar.</span>
        </div>
      )}
      
      {/* Hero Header */}
      <header className="relative z-10 pt-20 pb-12 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-christmas font-bold mb-4 drop-shadow-[0_0_15px_rgba(255,215,0,0.6)] text-christmas-gold animate-pulse">
            Amigo Oculto Galera do Paar
          </h1>
          <p className="text-xl md:text-2xl text-white font-light opacity-90 mb-8 max-w-2xl mx-auto drop-shadow-md font-christmas">
            Troque presentes e alegria sob o céu estrelado de Natal.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => {
                setEditingParticipant(undefined);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-christmas-red text-white px-8 py-3 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(212,36,38,0.6)] hover:bg-red-700 hover:scale-105 transition duration-200 border-2 border-christmas-gold"
            >
              <Plus className="w-6 h-6" />
              Entrar na Lista
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
        
        {participants.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 text-center text-white border border-white/20 max-w-2xl mx-auto shadow-2xl">
            <p className="text-3xl font-christmas mb-4">A noite está silenciosa...</p>
            <p className="text-lg opacity-80">Seja o primeiro a adicionar seu nome na lista do Paar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {participants.map(p => (
              <ParticipantCard 
                key={p.id} 
                participant={p} 
                onClick={() => setSelectedParticipant(p)} 
              />
            ))}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-white/60 text-sm font-christmas text-lg">
        <p>© {new Date().getFullYear()} Galera do Paar. Desenvolvido por Diogenes Araujo.</p>
      </footer>

      {/* Modals */}
      {isAddModalOpen && (
        <AddParticipantModal 
          key={editingParticipant ? editingParticipant.id : 'new-participant'}
          onClose={handleCloseModal} 
          onSave={handleSaveParticipant}
          initialData={editingParticipant}
        />
      )}

      {selectedParticipant && (
        <GiftDisplayModal 
          participant={selectedParticipant} 
          onClose={() => setSelectedParticipant(null)}
          onEdit={handleStartEditing}
        />
      )}

    </div>
  );
};

export default App;