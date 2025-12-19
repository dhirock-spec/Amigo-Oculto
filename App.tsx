import React, { useState, useEffect } from 'react';
import { Participant, FoodItem } from './types';
import Snowfall from './components/Snowfall';
import AddParticipantModal from './components/AddParticipantModal';
import AddFoodModal from './components/AddFoodModal';
import ParticipantCard from './components/ParticipantCard';
import GiftDisplayModal from './components/GiftDisplayModal';
import { Plus, Gift, Utensils, ChevronLeft, Pencil, Sparkles } from 'lucide-react';
import { 
  subscribeToParticipants, 
  saveParticipantToDb, 
  subscribeToFood, 
  saveFoodToDb, 
  isFirebaseConfigured 
} from './services/firebase';

type ViewMode = 'menu' | 'gifts' | 'food';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('menu');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | undefined>(undefined);
  const [editingFood, setEditingFood] = useState<FoodItem | undefined>(undefined);

  useEffect(() => {
    const unsubParticipants = subscribeToParticipants(setParticipants);
    const unsubFood = subscribeToFood(setFoodItems);
    return () => {
      unsubParticipants();
      unsubFood();
    };
  }, []);

  const handleSaveParticipant = async (p: Participant) => {
    await saveParticipantToDb(p);
    setIsAddParticipantOpen(false);
    setEditingParticipant(undefined);
  };

  const handleSaveFood = async (f: FoodItem) => {
    await saveFoodToDb(f);
    setIsAddFoodOpen(false);
    setEditingFood(undefined);
  };

  const activeParticipant = participants.find(p => p.id === selectedParticipantId) || null;

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5980?auto=format&fit=crop&q=80')] bg-cover bg-center bg-fixed text-slate-800 font-sans relative overflow-x-hidden">
      
      <div className="fixed inset-0 bg-blue-950/70 pointer-events-none z-0" />
      <Snowfall />
      
      {/* Header Comum */}
      <header className="relative z-10 pt-12 pb-6 px-4 text-center">
        <button 
          onClick={() => setView('menu')}
          className="mx-auto flex flex-col items-center hover:scale-105 transition duration-300"
        >
          <img 
            src="https://cdn-icons-png.flaticon.com/512/3662/3662584.png" 
            alt="Logo" 
            className="w-20 h-20 mb-2 drop-shadow-xl"
          />
          <h1 className="text-4xl md:text-6xl font-christmas font-bold text-christmas-gold drop-shadow-lg">
            Paar Noel 2024
          </h1>
        </button>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
        
        {/* VIEW: MENU DE ENTRADA */}
        {view === 'menu' && (
          <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch mt-12 max-w-4xl mx-auto">
            <button 
              onClick={() => setView('gifts')}
              className="flex-1 bg-christmas-red hover:bg-red-700 text-white p-8 rounded-3xl shadow-2xl border-4 border-christmas-gold transform hover:-translate-y-2 transition-all flex flex-col items-center gap-6 group"
            >
              <div className="bg-white/20 p-6 rounded-full group-hover:scale-110 transition">
                <Gift className="w-16 h-16 text-christmas-gold" />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-christmas font-bold mb-2">Amigo Oculto</h2>
                <p className="opacity-80 font-medium">Veja quem está na lista e o que querem ganhar!</p>
              </div>
            </button>

            <button 
              onClick={() => setView('food')}
              className="flex-1 bg-christmas-green hover:bg-green-800 text-white p-8 rounded-3xl shadow-2xl border-4 border-christmas-gold transform hover:-translate-y-2 transition-all flex flex-col items-center gap-6 group"
            >
              <div className="bg-white/20 p-6 rounded-full group-hover:scale-110 transition">
                <Utensils className="w-16 h-16 text-christmas-gold" />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-christmas font-bold mb-2">Ceia da Galera</h2>
                <p className="opacity-80 font-medium">O que vamos comer? Escolha seu prato (não vale repetir!)</p>
              </div>
            </button>
          </div>
        )}

        {/* VIEW: LISTA DE PRESENTES */}
        {view === 'gifts' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl backdrop-blur-lg border border-white/20">
              <button onClick={() => setView('menu')} className="text-white flex items-center gap-2 font-christmas text-xl hover:text-christmas-gold transition">
                <ChevronLeft /> Voltar ao Menu
              </button>
              <button 
                onClick={() => { setEditingParticipant(undefined); setIsAddParticipantOpen(true); }}
                className="bg-christmas-red text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition flex items-center gap-2 border-2 border-christmas-gold"
              >
                <Plus className="w-5 h-5" /> Entrar na Lista
              </button>
            </div>
            
            {participants.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 text-center text-white border border-white/20 max-w-2xl mx-auto">
                <p className="text-3xl font-christmas mb-2">Ninguém chegou ainda...</p>
                <p>Seja o primeiro a pedir seu presente!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {participants.map(p => (
                  <ParticipantCard key={p.id} participant={p} onClick={() => setSelectedParticipantId(p.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: LISTA DE COMIDAS */}
        {view === 'food' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl backdrop-blur-lg border border-white/20">
              <button onClick={() => setView('menu')} className="text-white flex items-center gap-2 font-christmas text-xl hover:text-christmas-gold transition">
                <ChevronLeft /> Voltar ao Menu
              </button>
              <div className="text-center hidden md:block">
                <h2 className="text-white font-christmas text-3xl">Ceia da Galera</h2>
                <p className="text-christmas-gold text-xs font-bold uppercase">Clique em um prato para editar ou trocar</p>
              </div>
              <button 
                onClick={() => { setEditingFood(undefined); setIsAddFoodOpen(true); }}
                className="bg-christmas-green text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition flex items-center gap-2 border-2 border-christmas-gold"
              >
                <Plus className="w-5 h-5" /> Adicionar Prato
              </button>
            </div>

            {foodItems.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 text-center text-white border border-white/20 max-w-2xl mx-auto">
                <Utensils className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-3xl font-christmas mb-2">A mesa está vazia!</p>
                <p>O que você vai preparar para a galera do Paar?</p>
              </div>
            ) : (
              <div className="bg-black/20 backdrop-blur-sm p-4 md:p-8 rounded-3xl border border-white/10 shadow-inner">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {foodItems.map(f => (
                    <div 
                      key={f.id} 
                      onClick={() => { setEditingFood(f); setIsAddFoodOpen(true); }}
                      className="group bg-white rounded-3xl overflow-hidden shadow-2xl border-t-8 border-christmas-green transform hover:-translate-y-2 transition duration-300 relative cursor-pointer active:scale-95"
                    >
                      {/* Badge indicando que é clicável */}
                      <div className="absolute top-4 right-4 z-20 bg-christmas-gold/90 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition duration-300">
                        <Pencil className="w-4 h-4" />
                      </div>

                      <div className="aspect-video relative overflow-hidden">
                        <img src={f.image} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 text-white">
                          <h3 className="text-2xl font-christmas font-bold drop-shadow-md">{f.name}</h3>
                        </div>
                      </div>

                      <div className="p-5 space-y-3 bg-white">
                        <p className="text-gray-600 italic leading-relaxed text-sm">"{f.caption || "Sem descrição"}"</p>
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Chef Paar:</p>
                              <p className="text-christmas-green font-bold text-sm">{f.contributorName}</p>
                            </div>
                          </div>
                          <div className="text-christmas-gold flex items-center gap-1">
                             <Sparkles className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase">Editar</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      <footer className="relative z-10 py-8 text-center text-white/60 text-sm font-christmas text-lg">
        <p>© {new Date().getFullYear()} Galera do Paar. Desenvolvido por Diogenes Araujo.</p>
        <p className="text-xs mt-2 opacity-50">
          {isFirebaseConfigured ? "🟢 Conectado ao Polo Norte" : "⚪ Modo Local (Offline)"}
        </p>
      </footer>

      {isAddParticipantOpen && (
        <AddParticipantModal onClose={() => setIsAddParticipantOpen(false)} onSave={handleSaveParticipant} initialData={editingParticipant} />
      )}

      {isAddFoodOpen && (
        <AddFoodModal 
          key={editingFood ? editingFood.id : 'new-food'}
          existingFoods={foodItems} 
          onClose={() => { setIsAddFoodOpen(false); setEditingFood(undefined); }} 
          onSave={handleSaveFood} 
          initialData={editingFood}
        />
      )}

      {activeParticipant && (
        <GiftDisplayModal 
          participant={activeParticipant} 
          onClose={() => setSelectedParticipantId(null)}
          onEdit={(p) => { setSelectedParticipantId(null); setEditingParticipant(p); setIsAddParticipantOpen(true); }}
        />
      )}

    </div>
  );
};

export default App;