import React, { useState, useEffect } from 'react';
import { Participant, FoodItem, Vote } from './types';
import Snowfall from './components/Snowfall';
import AddParticipantModal from './components/AddParticipantModal';
import AddFoodModal from './components/AddFoodModal';
import ParticipantCard from './components/ParticipantCard';
import GiftDisplayModal from './components/GiftDisplayModal';
import { Plus, Gift, Utensils, ChevronLeft, Pencil, Sparkles, HelpCircle, CheckCircle2, UserCheck, AlertCircle, Trash2 } from 'lucide-react';
import { 
  subscribeToParticipants, 
  saveParticipantToDb, 
  subscribeToFood, 
  saveFoodToDb, 
  subscribeToVotes,
  saveVoteToDb,
  deleteVoteFromDb,
  isFirebaseConfigured 
} from './services/firebase';

type ViewMode = 'menu' | 'gifts' | 'food' | 'quiz';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('menu');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | undefined>(undefined);
  const [editingFood, setEditingFood] = useState<FoodItem | undefined>(undefined);

  // Quiz States
  const [voterId, setVoterId] = useState('');
  const [guessId, setGuessId] = useState('');
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const unsubParticipants = subscribeToParticipants(setParticipants);
    const unsubFood = subscribeToFood(setFoodItems);
    const unsubVotes = subscribeToVotes(setVotes);
    return () => {
      unsubParticipants();
      unsubFood();
      unsubVotes();
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

  const handleCastVote = async () => {
    if (!voterId || !guessId) return;
    
    const voter = participants.find(p => p.id === voterId);
    const guessed = participants.find(p => p.id === guessId);
    if (!voter || !guessed) return;

    setIsVoting(true);
    const newVote: Vote = {
      id: voterId,
      voterName: voter.name,
      guessId: guessId,
      guessName: guessed.name
    };

    await saveVoteToDb(newVote);
    
    setIsVoting(false);
    setVoterId('');
    setGuessId('');
  };

  const handleEditVote = (vote: Vote) => {
    setVoterId(vote.id);
    setGuessId(vote.guessId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteVote = async (voteId: string) => {
    if (confirm('Tem certeza que deseja excluir seu palpite?')) {
      await deleteVoteFromDb(voteId);
      if (voterId === voteId) {
        setVoterId('');
        setGuessId('');
      }
    }
  };

  const activeParticipant = participants.find(p => p.id === selectedParticipantId) || null;
  const hasVoted = (id: string) => votes.some(v => v.id === id);
  const existingVote = votes.find(v => v.id === voterId);

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
            src="https://cdn-icons-png.flaticon.com/512/4605/4605151.png" 
            alt="Papai Noel Cool" 
            className="w-24 h-24 mb-2 drop-shadow-2xl animate-bounce"
            style={{ animationDuration: '3s' }}
          />
          <h1 className="text-4xl md:text-6xl font-christmas font-bold text-christmas-gold drop-shadow-lg animate-christmas-text">
            Amigo oculto Paar
          </h1>
        </button>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
        
        {/* VIEW: MENU DE ENTRADA */}
        {view === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <button 
              onClick={() => setView('gifts')}
              className="flex-1 bg-christmas-red hover:bg-red-700 text-white p-8 rounded-3xl shadow-2xl border-4 border-christmas-gold transform hover:-translate-y-2 transition-all flex flex-col items-center gap-6 group"
            >
              <div className="bg-white/20 p-6 rounded-full group-hover:scale-110 transition">
                <Gift className="w-16 h-16 text-christmas-gold" />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-christmas font-bold mb-2 animate-sway-only">Amigo Oculto</h2>
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
                <h2 className="text-3xl font-christmas font-bold mb-2 animate-sway-only">Ceia da Galera</h2>
                <p className="opacity-80 font-medium">O que vamos comer? Escolha seu prato!</p>
              </div>
            </button>

            <button 
              onClick={() => setView('quiz')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-8 rounded-3xl shadow-2xl border-4 border-christmas-gold transform hover:-translate-y-2 transition-all flex flex-col items-center gap-6 group"
            >
              <div className="bg-white/20 p-6 rounded-full group-hover:scale-110 transition">
                <HelpCircle className="w-16 h-16 text-christmas-gold" />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-christmas font-bold mb-2 animate-sway-only">Quiz Palpite</h2>
                <p className="opacity-80 font-medium">Quem você acha que tirou seu nome?</p>
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
                <p className="text-3xl font-christmas mb-2 animate-christmas-text">Ninguém chegou ainda...</p>
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
                <h2 className="text-white font-christmas text-3xl animate-christmas-text">Ceia da Galera</h2>
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
                <p className="text-3xl font-christmas mb-2 animate-christmas-text">A mesa está vazia!</p>
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
                          <h3 className="text-2xl font-christmas font-bold drop-shadow-md animate-sway-only">{f.name}</h3>
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

        {/* VIEW: QUIZ */}
        {view === 'quiz' && (
          <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl backdrop-blur-lg border border-white/20">
              <button onClick={() => setView('menu')} className="text-white flex items-center gap-2 font-christmas text-xl hover:text-christmas-gold transition">
                <ChevronLeft /> Voltar ao Menu
              </button>
              <h2 className="text-white font-christmas text-3xl animate-christmas-text hidden md:block">Quem tirou você?</h2>
              <div className="w-32"></div> {/* Spacer */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Vote Form */}
              <div className="bg-white rounded-3xl p-8 shadow-2xl border-b-8 border-blue-600">
                <h3 className="text-2xl font-christmas font-bold text-christmas-dark mb-6 flex items-center gap-2">
                  <UserCheck className="text-blue-600" />
                  {existingVote ? 'Atualizar seu Palpite' : 'Dê o seu Palpite'}
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Quem é você?</label>
                    <select 
                      value={voterId}
                      onChange={(e) => {
                        const newVoterId = e.target.value;
                        setVoterId(newVoterId);
                        const v = votes.find(v => v.id === newVoterId);
                        if (v) setGuessId(v.guessId);
                        else setGuessId('');
                      }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-slate-50 text-gray-900 font-bold focus:border-blue-500 outline-none transition"
                    >
                      <option value="">Selecione seu nome</option>
                      {participants.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} {hasVoted(p.id) ? ' (Já palpitou)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Quem você acha que tirou seu nome?</label>
                    <select 
                      value={guessId}
                      onChange={(e) => setGuessId(e.target.value)}
                      disabled={!voterId}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-slate-50 text-gray-900 font-bold focus:border-blue-500 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">{voterId ? 'Selecione um palpite' : 'Selecione quem você é primeiro'}</option>
                      {participants
                        .filter(p => p.id !== voterId) // NUNCA permite selecionar a si mesmo
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))
                      }
                    </select>
                    {voterId && (
                      <p className="mt-2 text-[10px] text-blue-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Note: Você não pode selecionar a si mesmo.
                      </p>
                    )}
                  </div>

                  <button 
                    onClick={handleCastVote}
                    disabled={!voterId || !guessId || isVoting}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase"
                  >
                    {isVoting ? <Sparkles className="animate-spin" /> : (existingVote ? "Atualizar Palpite!" : "Votar agora!")}
                  </button>
                  <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest italic">
                    Visível para todos! Você pode mudar seu palpite a qualquer momento selecionando seu nome.
                  </p>
                </div>
              </div>

              {/* Results */}
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-white shadow-2xl h-fit">
                <h3 className="text-2xl font-christmas font-bold mb-6 flex items-center gap-2">
                  <CheckCircle2 className="text-christmas-gold" />
                  Palpites da Galera
                </h3>
                
                {votes.length === 0 ? (
                  <div className="text-center py-12 opacity-50 italic">
                    Ainda não temos palpites... Seja o primeiro!
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {votes.map((v, i) => {
                      const voter = participants.find(p => p.id === v.id);
                      const guessed = participants.find(p => p.id === v.guessId);
                      
                      return (
                        <div key={i} className="bg-white/10 p-4 rounded-xl flex items-center justify-between border-l-4 border-christmas-gold group hover:bg-white/20 transition relative gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border-2 border-christmas-gold overflow-hidden bg-white shrink-0">
                               {voter?.avatar ? <img src={voter.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">?</div>}
                            </div>
                            <div>
                              <span className="text-christmas-gold font-bold text-[10px] block uppercase tracking-tighter">Palpite de:</span>
                              <span className="font-christmas text-lg leading-none">{v.voterName}</span>
                            </div>
                          </div>
                          
                          <div className="text-right flex items-center gap-3">
                            <div className="flex flex-col items-end">
                              <span className="text-white/60 font-bold text-[10px] block uppercase tracking-tighter">Acha que foi:</span>
                              <span className="font-christmas text-lg text-blue-300 leading-none">{v.guessName}</span>
                            </div>
                            <div className="w-10 h-10 rounded-full border-2 border-blue-400 overflow-hidden bg-white shrink-0">
                               {guessed?.avatar ? <img src={guessed.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">?</div>}
                            </div>
                            <div className="flex flex-col gap-1 ml-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                              <button 
                                onClick={() => handleEditVote(v)}
                                className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full transition"
                                title="Editar este palpite"
                              >
                                <Pencil className="w-3 h-3 text-white" />
                              </button>
                              <button 
                                onClick={() => handleDeleteVote(v.id)}
                                className="p-1.5 bg-red-500/30 hover:bg-red-500 rounded-full transition"
                                title="Excluir este palpite"
                              >
                                <Trash2 className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="relative z-10 py-8 text-center text-white/60 text-sm font-christmas text-lg">
        <p className="animate-sway-only">© {new Date().getFullYear()} Galera do Paar. Desenvolvido por Diogenes Araujo.</p>
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