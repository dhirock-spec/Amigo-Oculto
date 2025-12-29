import React, { useState, useEffect } from 'react';
import { Participant, FoodItem, Vote, SecretMessage, Poll, PollOption, PollVote } from './types';
import Snowfall from './components/Snowfall';
import AddParticipantModal from './components/AddParticipantModal';
import AddFoodModal from './components/AddFoodModal';
import ParticipantCard from './components/ParticipantCard';
import GiftDisplayModal from './components/GiftDisplayModal';
import { Plus, Gift, Utensils, ChevronLeft, HelpCircle, CheckCircle2, UserCheck, Trash2, Mail, Send, Trophy, Lock, Unlock, Award, ThumbsUp, X, Save, KeyRound, Users } from 'lucide-react';
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
  subscribeToPolls,
  savePollToDb,
  subscribeToPollOptions,
  savePollOptionToDb,
  subscribeToPollVotes,
  savePollVoteToDb,
  isFirebaseConfigured 
} from './services/firebase';

type ViewMode = 'menu' | 'gifts' | 'food' | 'quiz' | 'messages' | 'awards';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('menu');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [messages, setMessages] = useState<SecretMessage[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);
  const [pollVotes, setPollVotes] = useState<PollVote[]>([]);
  
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const [isAddPollOpen, setIsAddPollOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | undefined>(undefined);
  const [editingFood, setEditingFood] = useState<FoodItem | undefined>(undefined);

  // Awards/Polls States
  const [newOptionName, setNewOptionName] = useState<{ [pollId: string]: string }>({});
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollDesc, setNewPollDesc] = useState('');
  const [currentVoterId, setCurrentVoterId] = useState('');

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
    const unsubPolls = subscribeToPolls(setPolls);
    const unsubOptions = subscribeToPollOptions(setPollOptions);
    const unsubPollVotes = subscribeToPollVotes(setPollVotes);
    
    return () => {
      unsubParticipants();
      unsubFood();
      unsubVotes();
      unsubMessages();
      unsubPolls();
      unsubOptions();
      unsubPollVotes();
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
      recipientId: '', 
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

  const handleAddPollOption = async (pollId: string) => {
    const name = newOptionName[pollId];
    if (!name || !name.trim()) return;

    const newOption: PollOption = {
      id: crypto.randomUUID(),
      pollId: pollId,
      name: name.trim(),
      votes: 0
    };

    await savePollOptionToDb(newOption);
    setNewOptionName(prev => ({ ...prev, [pollId]: '' }));
  };

  const handleCreatePoll = async () => {
    if (!newPollTitle.trim()) return;
    
    const newPoll: Poll = {
      id: crypto.randomUUID(),
      title: newPollTitle.trim(),
      description: newPollDesc.trim() || 'Quem merece esse título?'
    };

    await savePollToDb(newPoll);
    setIsAddPollOpen(false);
    setNewPollTitle('');
    setNewPollDesc('');
  };

  const handleVoteOnPoll = async (pollId: string, optionId: string) => {
    if (!currentVoterId) {
      alert("Por favor, selecione QUEM está votando no topo da página!");
      return;
    }

    const voter = participants.find(p => p.id === currentVoterId);
    const option = pollOptions.find(o => o.id === optionId);
    if (!voter || !option) return;

    // Check if already voted in THIS poll
    const existingVote = pollVotes.find(v => v.pollId === pollId && v.participantId === currentVoterId);
    
    if (existingVote) {
      if (existingVote.optionId === optionId) {
        alert("Você já votou nesta opção! 🎅");
        return;
      }
      
      const confirmChange = confirm(`Peraí ${voter.name}! Você já votou em "${existingVote.optionName}". Deseja MUDAR seu voto para "${option.name}"? 🎅`);
      if (!confirmChange) return;
    }

    const newPollVote: PollVote = {
      id: existingVote ? existingVote.id : crypto.randomUUID(),
      pollId: pollId,
      optionId: optionId,
      participantId: currentVoterId,
      participantName: voter.name,
      optionName: option.name
    };

    await savePollVoteToDb(newPollVote, existingVote?.optionId);
  };

  const handleAdminLogin = () => {
    if (adminPassword === "1181") {
      setIsAdmin(true);
      setIsAdminLoginOpen(false);
      setAdminPassword('');
    } else {
      alert("Código incorreto!");
      setAdminPassword('');
    }
  };

  const activeParticipant = participants.find(p => p.id === selectedParticipantId) || null;

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 max-w-6xl mx-auto">
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

            <button onClick={() => setView('awards')} className="flex-1 bg-gradient-to-br from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 text-white p-8 rounded-3xl shadow-2xl border-4 border-christmas-gold transform hover:-translate-y-2 transition-all flex flex-col items-center gap-6 group">
              <div className="bg-white/20 p-6 rounded-full group-hover:scale-110 transition"><Trophy className="w-12 h-12 text-white" /></div>
              <div className="text-center">
                <h2 className="text-2xl font-christmas font-bold mb-2">Premiações</h2>
                <p className="opacity-80 text-xs">As melhores enquetes do Natal!</p>
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

        {/* PREMIAÇÕES / ENQUETES */}
        {view === 'awards' && (
          <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center bg-black/40 p-4 rounded-2xl backdrop-blur-lg border border-white/20 gap-4">
              <button onClick={() => setView('menu')} className="text-white flex items-center gap-2 font-christmas text-xl hover:text-christmas-gold transition shrink-0"><ChevronLeft /> Voltar</button>
              
              <div className="flex flex-col items-center gap-1 flex-1">
                 <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Quem está votando?</label>
                 <select 
                   value={currentVoterId} 
                   onChange={(e) => setCurrentVoterId(e.target.value)}
                   className="bg-white/10 border border-white/20 text-white font-bold rounded-full px-4 py-2 outline-none focus:bg-white/20 transition cursor-pointer text-sm"
                 >
                   <option value="" className="text-slate-800">Selecione seu nome...</option>
                   {participants.map(p => <option key={p.id} value={p.id} className="text-slate-800">{p.name}</option>)}
                 </select>
              </div>

              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={isAdmin ? () => setIsAddPollOpen(true) : () => setIsAdminLoginOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full font-bold transition shadow-lg bg-white text-christmas-dark border-2 border-christmas-gold hover:scale-105"
                >
                  <Plus className="w-4 h-4" /> Nova Categoria
                </button>
                <button 
                  onClick={isAdmin ? () => setIsAdmin(false) : () => setIsAdminLoginOpen(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition shadow-lg ${isAdmin ? 'bg-red-500 text-white' : 'bg-christmas-gold text-christmas-dark'}`}
                >
                  {isAdmin ? <><Lock className="w-4 h-4" /> Ocultar Placar</> : <><Unlock className="w-4 h-4" /> Ver Resultados</>}
                </button>
              </div>
            </div>

            {!currentVoterId && (
              <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-2xl p-4 text-white text-center animate-pulse">
                <p className="font-bold flex items-center justify-center gap-2"><HelpCircle className="w-5 h-5" /> Por favor, selecione seu nome acima para poder votar!</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {polls.map(poll => {
                const options = pollOptions.filter(o => o.pollId === poll.id);
                const totalVotes = options.reduce((sum, o) => sum + (o.votes || 0), 0);
                const votersOfThisPoll = pollVotes.filter(v => v.pollId === poll.id);
                const myVoteInThisPoll = votersOfThisPoll.find(v => v.participantId === currentVoterId);
                
                return (
                  <div key={poll.id} className="bg-white rounded-3xl overflow-hidden shadow-2xl border-b-8 border-yellow-600 flex flex-col transform hover:scale-[1.01] transition-transform">
                    <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-5 text-white">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <Award className="w-6 h-6 text-yellow-200" />
                            <h3 className="text-xl font-christmas font-bold">{poll.title}</h3>
                         </div>
                         {myVoteInThisPoll && (
                           <span title={`Você votou em: ${myVoteInThisPoll.optionName}`}>
                             <CheckCircle2 className="w-5 h-5 text-green-400" />
                           </span>
                         )}
                      </div>
                      <p className="text-[10px] opacity-80 uppercase font-black tracking-widest mt-1">{poll.description}</p>
                    </div>
                    
                    <div className="p-6 flex-1 space-y-4">
                      <div className="space-y-3">
                        {options.length === 0 ? (
                          <p className="text-center text-gray-400 italic text-sm py-4">Nenhuma opção ainda...</p>
                        ) : (
                          options.sort((a,b) => (b.votes || 0) - (a.votes || 0)).map(option => {
                            const isMyChoice = myVoteInThisPoll?.optionId === option.id;
                            return (
                              <div key={option.id} className="group">
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`font-bold text-sm flex items-center gap-2 ${isMyChoice ? 'text-green-600' : 'text-christmas-dark'}`}>
                                    {option.name}
                                    {isAdmin && (option.votes || 0) === Math.max(...options.map(o => o.votes || 0)) && (option.votes || 0) > 0 && (
                                      <Trophy className="w-3 h-3 text-yellow-600 animate-bounce" />
                                    )}
                                    {isMyChoice && <span className="bg-green-100 text-green-600 text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">Seu Voto</span>}
                                  </span>
                                  {isAdmin && <span className="text-xs font-black text-yellow-700">{option.votes || 0} votos</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                                    {isAdmin && (
                                      <div 
                                        className={`h-full transition-all duration-1000 ${isMyChoice ? 'bg-green-400' : 'bg-yellow-400'}`}
                                        style={{ width: `${totalVotes > 0 ? ((option.votes || 0) / totalVotes) * 100 : 0}%` }}
                                      />
                                    )}
                                    <button 
                                      onClick={() => handleVoteOnPoll(poll.id, option.id)}
                                      className={`absolute inset-0 w-full h-full flex items-center justify-center text-[10px] font-black uppercase transition-opacity ${isMyChoice ? 'opacity-0 cursor-default' : 'opacity-0 group-hover:opacity-100 bg-black/10 hover:bg-black/20'}`}
                                    >
                                      {myVoteInThisPoll ? 'Mudar para este' : `Votar em ${option.name}`}
                                    </button>
                                  </div>
                                  <button 
                                    onClick={() => handleVoteOnPoll(poll.id, option.id)} 
                                    className={`p-2 rounded-lg transition ${isMyChoice ? 'bg-green-100 text-green-600' : 'bg-slate-50 hover:bg-yellow-100 text-yellow-700'}`}
                                  >
                                    <ThumbsUp className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Sugerir Opção</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={newOptionName[poll.id] || ''}
                            onChange={(e) => setNewOptionName(prev => ({ ...prev, [poll.id]: e.target.value }))}
                            placeholder="Nome de alguém..." 
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-yellow-600"
                          />
                          <button 
                            onClick={() => handleAddPollOption(poll.id)}
                            className="p-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition shadow-md"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* LISTA DE QUEM VOTOU EM QUE */}
                      <div className="pt-4 mt-2 border-t border-gray-100">
                         <h4 className="text-[10px] font-black text-christmas-dark/40 uppercase mb-2 flex items-center gap-1">
                           <Users className="w-3 h-3" /> Quem já votou ({votersOfThisPoll.length})
                         </h4>
                         <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                            {votersOfThisPoll.length === 0 ? (
                              <span className="text-[9px] text-slate-300 italic">Ninguém votou ainda...</span>
                            ) : (
                              votersOfThisPoll.map(v => (
                                <div key={v.id} className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200 flex flex-col items-start leading-tight">
                                  <span className="text-[9px] font-bold text-slate-800">{v.participantName}</span>
                                  <span className="text-[8px] text-slate-500">votou em {v.optionName}</span>
                                </div>
                              ))
                            )}
                         </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODAL ADMIN LOGIN */}
        {isAdminLoginOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border-4 border-christmas-gold animate-in zoom-in duration-200">
              <div className="bg-christmas-red p-5 flex justify-between items-center text-white">
                <h3 className="text-xl font-christmas font-bold flex items-center gap-2"><KeyRound className="w-5 h-5" /> Acesso Restrito</h3>
                <button onClick={() => setIsAdminLoginOpen(false)} className="hover:bg-white/20 p-2 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-8 space-y-6">
                <p className="text-center text-gray-600 font-medium text-sm">Digite o código de acesso para ver resultados ou gerenciar categorias.</p>
                <div>
                  <input 
                    type="password" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                    placeholder="Código (1181)" 
                    className="w-full px-4 py-4 bg-slate-50 border-2 border-gray-100 rounded-2xl font-black text-2xl tracking-[1em] text-center outline-none focus:border-christmas-gold focus:bg-white transition-all"
                  />
                </div>
                <button 
                  onClick={handleAdminLogin}
                  className="w-full py-4 bg-christmas-green hover:bg-green-800 text-white font-black text-lg rounded-2xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <Unlock className="w-5 h-5" /> Liberar Acesso
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ADICIONAR ENQUETE (CATEGORIA) */}
        {isAddPollOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-4 border-christmas-gold animate-in zoom-in duration-200">
              <div className="bg-yellow-600 p-5 flex justify-between items-center text-white">
                <h3 className="text-xl font-christmas font-bold flex items-center gap-2"><Trophy className="w-5 h-5" /> Nova Categoria</h3>
                <button onClick={() => setIsAddPollOpen(false)} className="hover:bg-white/20 p-2 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-black text-yellow-600 uppercase tracking-widest block mb-1">Título da Premiação</label>
                  <input 
                    type="text" 
                    value={newPollTitle}
                    onChange={(e) => setNewPollTitle(e.target.value)}
                    placeholder="Ex: O mais dorminhoco" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-gray-100 rounded-xl font-bold outline-none focus:border-yellow-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-yellow-600 uppercase tracking-widest block mb-1">Descrição</label>
                  <input 
                    type="text" 
                    value={newPollDesc}
                    onChange={(e) => setNewPollDesc(e.target.value)}
                    placeholder="Ex: Quem sempre dorme no sofá do Paar?" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-gray-100 rounded-xl font-bold outline-none focus:border-yellow-600"
                  />
                </div>
                <button 
                  onClick={handleCreatePoll}
                  disabled={!newPollTitle.trim()}
                  className="w-full py-4 bg-yellow-600 hover:bg-yellow-700 text-white font-black text-lg rounded-2xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" /> Criar Categoria
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CORREIO SECRETO */}
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