import React, { useState, useEffect } from 'react';
import { Participant, FoodItem, Vote, SecretMessage } from './types';
import Snowfall from './components/Snowfall';
import AddParticipantModal from './components/AddParticipantModal';
import AddFoodModal from './components/AddFoodModal';
import ParticipantCard from './components/ParticipantCard';
import GiftDisplayModal from './components/GiftDisplayModal';
import { Plus, Gift, Utensils, ChevronLeft, Pencil, Sparkles, HelpCircle, CheckCircle2, UserCheck, AlertCircle, Trash2, Mail, Send, User } from 'lucide-react';
import { 
  subscribeToParticipants, 
  saveParticipantToDb, 
  subscribeToFood, 
  saveFoodToDb, 
  subscribeToVotes,
  saveVoteToDb,
  deleteVoteFromDb,
  subscribeToMessages,
  saveMessageToDb,
  deleteMessageFromDb,
  isFirebaseConfigured 
} from './services/firebase';

type ViewMode = 'menu' | 'gifts' | 'food' | 'quiz' | 'messages';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('menu');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [messages, setMessages] = useState<SecretMessage[]>([]);
  
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | undefined>(undefined);
  const [editingFood, setEditingFood] = useState<FoodItem | undefined>(undefined);

  // Quiz States
  const [voterId, setVoterId] = useState('');
  const [guessId, setGuessId] = useState('');
  const [isVoting, setIsVoting] = useState(false);

  // Messages States
  const [msgRecipientName, setMsgRecipientName] = useState('');
  const [msgSenderName, setMsgSenderName] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  useEffect(() => {
    const unsubParticipants = subscribeToParticipants(setParticipants);
    const unsubFood = subscribeToFood(setFoodItems);
    const unsubVotes = subscribeToVotes(setVotes);
    const unsubMessages = subscribeToMessages(setMessages);
    return () => {
      unsubParticipants();
      unsubFood();
      unsubVotes();
      unsubMessages();
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

  const handleSendMessage = async () => {
    if (!msgRecipientName.trim() || !msgContent.trim()) return;

    setIsSendingMsg(true);
    const newMessage: SecretMessage = {
      id: crypto.randomUUID(),
      senderName: msgSenderName.trim() || 'Anônimo 🎅',
      recipientId: '', // Livre, sem ID fixo
      recipientName: msgRecipientName.trim(),
      content: msgContent,
      createdAt: Date.now()
    };

    await saveMessageToDb(newMessage);
    setIsSendingMsg(false);
    setMsgContent('');
    setMsgSenderName('');
    setMsgRecipientName('');
  };

  const handleDeleteMessage = async (id: string) => {
    if (confirm('Deseja remover esta mensagem do mural?')) {
      await deleteMessageFromDb(id);
    }
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
      
      <header className="relative z-10 pt-12 pb-6 px-4 text-center">
        <button onClick={() => setView('menu')} className="mx-auto flex flex-col items-center hover:scale-105 transition duration-300">
          <img src="https://cdn-icons-png.flaticon.com/512/4605/4605151.png" alt="Logo" className="w-24 h-24 mb-2 drop-shadow-2xl animate-bounce" style={{ animationDuration: '3s' }} />
          <h1 className="text-4xl md:text-6xl font-christmas font-bold text-christmas-gold drop-shadow-lg animate-christmas-text">Amigo Oculto Paar</h1>
        </button>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
        
        {view === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 max-w-6xl mx-auto">
            <button onClick={() => setView('gifts')} className="flex-1 bg-christmas-red hover:bg-red-700 text-white p-8 rounded-3xl shadow-2xl border-4 border-christmas-gold transform hover:-translate-y-2 transition-all flex flex-col items-center gap-6 group">
              <div className="bg-white/20 p-6 rounded-full group-hover:scale-110 transition"><Gift className="w-12 h-12 text-christmas-gold" /></div>
              <div className="text-center">
                <h2 className="text-2xl font-christmas font-bold mb-2">Amigo Oculto</h2>
                <p className="opacity-80 text-xs">Ideias de presentes da galera!</p>
              </div>
            </button>

            <button onClick={() => setView('food')} className="flex-1 bg-christmas-green hover:bg-green-800 text-white p-8 rounded-3xl shadow-2xl border-4 border-christmas-gold transform hover:-translate-y-2 transition-all flex flex-col items-center gap-6 group">
              <div className="bg-white/20 p-6 rounded-full group-hover:scale-110 transition"><Utensils className="w-12 h-12 text-christmas-gold" /></div>
              <div className="text-center">
                <h2 className="text-2xl font-christmas font-bold mb-2">Ceia da Galera</h2>
                <p className="opacity-80 text-xs">O que cada um vai trazer!</p>
              </div>
            </button>

            <button onClick={() => setView('messages')} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white p-8 rounded-3xl shadow-2xl border-4 border-christmas-gold transform hover:-translate-y-2 transition-all flex flex-col items-center gap-6 group">
              <div className="bg-white/20 p-6 rounded-full group-hover:scale-110 transition"><Mail className="w-12 h-12 text-christmas-gold" /></div>
              <div className="text-center">
                <h2 className="text-2xl font-christmas font-bold mb-2">Correio Secreto</h2>
                <p className="opacity-80 text-xs">Fale o que você não tem coragem!</p>
              </div>
            </button>

            <button onClick={() => setView('quiz')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-8 rounded-3xl shadow-2xl border-4 border-christmas-gold transform hover:-translate-y-2 transition-all flex flex-col items-center gap-6 group">
              <div className="bg-white/20 p-6 rounded-full group-hover:scale-110 transition"><HelpCircle className="w-12 h-12 text-christmas-gold" /></div>
              <div className="text-center">
                <h2 className="text-2xl font-christmas font-bold mb-2">Palpites</h2>
                <p className="opacity-80 text-xs">Quem tirou quem?</p>
              </div>
            </button>
          </div>
        )}

        {view === 'messages' && (
          <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl backdrop-blur-lg border border-white/20">
              <button onClick={() => setView('menu')} className="text-white flex items-center gap-2 font-christmas text-xl hover:text-christmas-gold transition"><ChevronLeft /> Voltar</button>
              <h2 className="text-white font-christmas text-3xl animate-christmas-text hidden md:block">Correio Secreto Paar</h2>
              <div className="w-32"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-2xl border-b-8 border-orange-600 h-fit">
                <h3 className="text-xl font-christmas font-bold text-christmas-dark mb-4 flex items-center gap-2"><Send className="text-orange-600 w-5 h-5" /> Enviar Correio</h3>
                <div className="space-y-4">
                  <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Para quem?</label>
                    <input 
                      type="text" 
                      value={msgRecipientName} 
                      onChange={(e) => setMsgRecipientName(e.target.value)} 
                      placeholder="Nome de quem vai receber..." 
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 font-bold text-sm" 
                    />
                  </div>
                  <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Seu Nome ou Apelido</label>
                    <input 
                      type="text" 
                      value={msgSenderName} 
                      onChange={(e) => setMsgSenderName(e.target.value)} 
                      placeholder="Ex: Papai Noel, Admirador..." 
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 font-bold text-sm" 
                    />
                    <p className="text-[9px] text-gray-400 mt-1 italic">* Deixe em branco para enviar como Anônimo 🎅</p>
                  </div>
                  <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Sua Mensagem</label>
                    <textarea value={msgContent} onChange={(e) => setMsgContent(e.target.value)} placeholder="Escreva algo legal aqui..." className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm h-32 resize-none" />
                  </div>
                  <button onClick={handleSendMessage} disabled={!msgRecipientName.trim() || !msgContent.trim() || isSendingMsg} className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-lg transition-all disabled:opacity-50">Enviar Correio!</button>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-2xl font-christmas font-bold text-white flex items-center gap-2 mb-4"><Mail className="text-christmas-gold" /> Mural do Correio Secreto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  {messages.length === 0 ? <div className="col-span-full text-center py-20 text-white/50 italic">Nenhuma carta no mural ainda...</div> : messages.map((m) => (
                    <div key={m.id} className="bg-christmas-cream p-5 rounded-2xl shadow-lg border-2 border-christmas-gold relative group transform hover:rotate-1 transition-all">
                      <div className="absolute -top-2 -right-2 bg-christmas-red text-white p-1 rounded shadow-md"><Mail className="w-4 h-4" /></div>
                      <div className="mb-4">
                        <span className="text-[9px] font-black text-christmas-red uppercase tracking-tighter">Para:</span>
                        <h5 className="font-christmas text-xl text-christmas-dark border-b border-christmas-gold/30 pb-1">{m.recipientName}</h5>
                      </div>
                      <p className="text-gray-700 font-medium italic text-sm mb-6 leading-relaxed">"{m.content}"</p>
                      <div className="flex justify-between items-end border-t border-christmas-gold/20 pt-2 mt-auto">
                        <div>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter block">Assinado:</span>
                          <span className="font-christmas text-md text-christmas-green">{m.senderName}</span>
                        </div>
                        <button onClick={() => handleDeleteMessage(m.id)} className="p-1 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LISTA DE PARTICIPANTES (AMIGO OCULTO) */}
        {view === 'gifts' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl backdrop-blur-lg border border-white/20">
              <button onClick={() => setView('menu')} className="text-white flex items-center gap-2 font-christmas text-xl hover:text-christmas-gold transition"><ChevronLeft /> Voltar</button>
              <button onClick={() => { setEditingParticipant(undefined); setIsAddParticipantOpen(true); }} className="bg-christmas-red text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition flex items-center gap-2 border-2 border-christmas-gold"><Plus className="w-5 h-5" /> Entrar na Lista</button>
            </div>
            {participants.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 text-center text-white border border-white/20 max-w-2xl mx-auto"><p className="text-3xl font-christmas">Ninguém chegou ainda...</p></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {participants.map(p => <ParticipantCard key={p.id} participant={p} onClick={() => setSelectedParticipantId(p.id)} />)}
              </div>
            )}
          </div>
        )}

        {/* CEIA DA GALERA */}
        {view === 'food' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl backdrop-blur-lg border border-white/20">
              <button onClick={() => setView('menu')} className="text-white flex items-center gap-2 font-christmas text-xl hover:text-christmas-gold transition"><ChevronLeft /> Voltar</button>
              <button onClick={() => { setEditingFood(undefined); setIsAddFoodOpen(true); }} className="bg-christmas-green text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition flex items-center gap-2 border-2 border-christmas-gold"><Plus className="w-5 h-5" /> Adicionar Prato</button>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-white font-christmas text-4xl animate-christmas-text">Ceia da Galera</h2>
            </div>
            {foodItems.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 text-center text-white border border-white/20 max-w-2xl mx-auto"><p className="text-3xl font-christmas">A mesa está vazia!</p></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {foodItems.map(f => (
                  <div key={f.id} onClick={() => { setEditingFood(f); setIsAddFoodOpen(true); }} className="group bg-white rounded-3xl overflow-hidden shadow-2xl border-t-8 border-christmas-green transform hover:-translate-y-2 transition duration-300 cursor-pointer">
                    <div className="aspect-video relative overflow-hidden"><img src={f.image} className="w-full h-full object-cover group-hover:scale-110 transition" /><div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 p-4 text-white"><h3 className="text-2xl font-christmas font-bold">{f.name}</h3></div></div>
                    <div className="p-5 bg-white"><p className="text-christmas-green font-bold text-sm">Chef: {f.contributorName}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* QUIZ */}
        {view === 'quiz' && (
          <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl backdrop-blur-lg border border-white/20">
              <button onClick={() => setView('menu')} className="text-white flex items-center gap-2 font-christmas text-xl hover:text-christmas-gold transition"><ChevronLeft /> Voltar</button>
              <h2 className="text-white font-christmas text-3xl hidden md:block">Quem tirou você?</h2>
              <div className="w-32"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-8 shadow-2xl border-b-8 border-blue-600">
                <h3 className="text-2xl font-christmas font-bold text-christmas-dark mb-6 flex items-center gap-2"><UserCheck className="text-blue-600" />Dar seu Palpite</h3>
                <div className="space-y-6">
                  <select value={voterId} onChange={(e) => { setVoterId(e.target.value); const v = votes.find(v => v.id === e.target.value); if (v) setGuessId(v.guessId); else setGuessId(''); }} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-slate-50 text-gray-900 font-bold outline-none"><option value="">Seu nome</option>{participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  <select value={guessId} onChange={(e) => setGuessId(e.target.value)} disabled={!voterId} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-slate-50 text-gray-900 font-bold outline-none disabled:opacity-50"><option value="">Seu palpite</option>{participants.filter(p => p.id !== voterId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  <button onClick={handleCastVote} disabled={!voterId || !guessId || isVoting} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl shadow-lg transition-all disabled:opacity-50">{isVoting ? "Votando..." : "Votar agora!"}</button>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-white shadow-2xl h-fit">
                <h3 className="text-2xl font-christmas font-bold mb-6 flex items-center gap-2"><CheckCircle2 className="text-christmas-gold" />Palpites do Grupo</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {votes.length === 0 ? <div className="text-center py-12 opacity-50 italic">Nenhum palpite ainda.</div> : votes.map((v, i) => (
                    <div key={i} className="bg-white/10 p-4 rounded-xl flex items-center justify-between border-l-4 border-christmas-gold"><div className="flex flex-col"><span className="text-christmas-gold font-bold text-[10px]">PALPITE DE:</span><span className="font-christmas text-lg">{v.voterName}</span></div><div className="text-right flex flex-col"><span className="text-white/60 font-bold text-[10px]">ACHA QUE FOI:</span><span className="font-christmas text-lg text-blue-300">{v.guessName}</span></div></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="relative z-10 py-8 text-center text-white/60 text-sm font-christmas text-lg">
        <p className="animate-sway-only">© {new Date().getFullYear()} Galera do Paar. Desenvolvido por Diogenes Araujo.</p>
        <p className="text-xs mt-2 opacity-50">{isFirebaseConfigured ? "🟢 Conectado" : "⚪ Modo Offline"}</p>
      </footer>

      {isAddParticipantOpen && <AddParticipantModal onClose={() => setIsAddParticipantOpen(false)} onSave={handleSaveParticipant} initialData={editingParticipant} />}
      {isAddFoodOpen && <AddFoodModal key={editingFood ? editingFood.id : 'new-food'} existingFoods={foodItems} onClose={() => { setIsAddFoodOpen(false); setEditingFood(undefined); }} onSave={handleSaveFood} initialData={editingFood} />}
      {activeParticipant && <GiftDisplayModal participant={activeParticipant} onClose={() => setSelectedParticipantId(null)} onEdit={(p) => { setSelectedParticipantId(null); setEditingParticipant(p); setIsAddParticipantOpen(true); }} />}

    </div>
  );
};

export default App;