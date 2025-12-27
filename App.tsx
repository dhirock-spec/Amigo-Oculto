import React, { useState, useEffect } from 'react';
import { Participant, FoodItem, Vote, MusicRequest } from './types';
import Snowfall from './components/Snowfall';
import AddParticipantModal from './components/AddParticipantModal';
import AddFoodModal from './components/AddFoodModal';
import ParticipantCard from './components/ParticipantCard';
import GiftDisplayModal from './components/GiftDisplayModal';
import { Plus, Gift, Utensils, ChevronLeft, Pencil, HelpCircle, CheckCircle2, UserCheck, AlertCircle, Trash2, Sparkles, Music, Play, SkipForward, Search, Loader2 } from 'lucide-react';
import { 
  subscribeToParticipants, 
  saveParticipantToDb, 
  subscribeToFood, 
  saveFoodToDb, 
  subscribeToVotes,
  saveVoteToDb,
  deleteVoteFromDb,
  subscribeToMusicQueue,
  saveMusicToDb,
  removeMusicFromDb,
  isFirebaseConfigured 
} from './services/firebase';
import { searchMusicOnYoutube } from './services/geminiService';

type ViewMode = 'menu' | 'gifts' | 'food' | 'quiz' | 'playlist';

interface QuickSuggestion {
  label: string;
  query: string;
  emoji: string;
}

const QUICK_SUGGESTIONS: QuickSuggestion[] = [
  { label: "Jingle Bell Rock", query: "Jingle Bell Rock Bobby Helms", emoji: "🎸" },
  { label: "All I Want for Xmas", query: "Mariah Carey All I Want for Christmas Is You", emoji: "🎤" },
  { label: "Last Christmas", query: "Wham Last Christmas", emoji: "❄️" },
  { label: "Feliz Navidad", query: "José Feliciano Feliz Navidad", emoji: "🪅" },
  { label: "Então é Natal", query: "Simone Então é Natal", emoji: "🇧🇷" },
  { label: "Merry Christmas", query: "Ed Sheeran Elton John Merry Christmas", emoji: "🎹" },
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('menu');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [musicQueue, setMusicQueue] = useState<MusicRequest[]>([]);
  
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | undefined>(undefined);
  const [editingFood, setEditingFood] = useState<FoodItem | undefined>(undefined);

  // Quiz States
  const [voterId, setVoterId] = useState('');
  const [guessId, setGuessId] = useState('');
  const [isVoting, setIsVoting] = useState(false);

  // Music States
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [requesterId, setRequesterId] = useState('');
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [musicError, setMusicError] = useState('');

  useEffect(() => {
    const unsubParticipants = subscribeToParticipants(setParticipants);
    const unsubFood = subscribeToFood(setFoodItems);
    const unsubVotes = subscribeToVotes(setVotes);
    const unsubMusic = subscribeToMusicQueue(setMusicQueue);
    return () => {
      unsubParticipants();
      unsubFood();
      unsubVotes();
      unsubMusic();
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

  const handleAddMusic = async (overrideQuery?: string) => {
    const query = overrideQuery || musicSearchQuery;
    if (!query || !requesterId) {
      if (!requesterId) setMusicError('Selecione quem está pedindo primeiro!');
      return;
    }
    
    const requester = participants.find(p => p.id === requesterId);
    if (!requester) return;

    setIsSearchingMusic(true);
    setMusicError('');

    try {
      const result = await searchMusicOnYoutube(query);
      
      if (!result || !result.youtubeId) {
        setMusicError('Não consegui encontrar essa música no YouTube. Tente outro nome!');
        return;
      }

      // Evita duplicatas na fila
      if (musicQueue.some(m => m.youtubeId === result.youtubeId)) {
        setMusicError('Essa música já está na fila! Escolha outra.');
        return;
      }

      const newRequest: MusicRequest = {
        id: crypto.randomUUID(),
        youtubeId: result.youtubeId,
        title: result.title,
        artist: result.artist,
        thumbnail: result.thumbnail,
        requesterName: requester.name,
        requesterId: requesterId,
        createdAt: Date.now()
      };

      await saveMusicToDb(newRequest);
      setMusicSearchQuery('');
    } catch (err) {
      setMusicError('Ocorreu um erro ao buscar a música.');
    } finally {
      setIsSearchingMusic(false);
    }
  };

  const handleRemoveMusic = async (id: string) => {
    if (confirm('Remover esta música da fila?')) {
      await removeMusicFromDb(id);
    }
  };

  const activeParticipant = participants.find(p => p.id === selectedParticipantId) || null;
  const hasVoted = (id: string) => votes.some(v => v.id === id);
  const existingVote = votes.find(v => v.id === voterId);
  const currentMusic = musicQueue[0] || null;

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5980?auto=format&fit=crop&q=80')] bg-cover bg-center bg-fixed text-slate-800 font-sans relative overflow-x-hidden">
      
      <div className="fixed inset-0 bg-blue-950/70 pointer-events-none z-0" />
      <Snowfall />
      
      <header className="relative z-10 pt-12 pb-6 px-4 text-center">
        <button onClick={() => setView('menu')} className="mx-auto flex flex-col items-center hover:scale-105 transition duration-300">
          <img src="https://cdn-icons-png.flaticon.com/512/4605/4605151.png" alt="Papai Noel" className="w-24 h-24 mb-2 animate-bounce" style={{ animationDuration: '3s' }} />
          <h1 className="text-4xl md:text-6xl font-christmas font-bold text-christmas-gold drop-shadow-lg animate-christmas-text">
            Amigo oculto Paar
          </h1>
        </button>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
        
        {view === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12 max-w-7xl mx-auto">
            <button onClick={() => setView('gifts')} className="flex-1 bg-christmas-red hover:bg-red-700 text-white p-8 rounded-3xl shadow-2xl border-4 border-christmas-gold transform hover:-translate-y-2 transition-all flex flex-col items-center gap-6 group">
              <div className="bg-white/20 p-6 rounded-full group-hover:scale-110 transition"><Gift className="w-16 h-16 text-christmas-gold" /></div>
              <div className="text-center">
                <h2 className="text-3xl font-christmas font-bold mb-2">Amigo Oculto</h2>
                <p className="opacity-80 font-medium">Veja quem está na lista e o que querem ganhar!</p>
              </div>
            </button>

            <button onClick={() => setView('food')} className="flex-1 bg-christmas-green hover:bg-green-800 text-white p-8 rounded-3xl shadow-2xl border-4 border-christmas-gold transform hover:-translate-y-2 transition-all flex flex-col items-center gap-6 group">
              <div className="bg-white/20 p-6 rounded-full group-hover:scale-110 transition"><Utensils className="w-16 h-16 text-christmas-gold" /></div>
              <div className="text-center">
                <h2 className="text-3xl font-christmas font-bold mb-2">Ceia da Galera</h2>
                <p className="opacity-80 font-medium">O que vamos comer? Escolha seu prato!</p>
              </div>
            </button>

            <button onClick={() => setView('quiz')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-8 rounded-3xl shadow-2xl border-4 border-christmas-gold transform hover:-translate-y-2 transition-all flex flex-col items-center gap-6 group">
              <div className="bg-white/20 p-6 rounded-full group-hover:scale-110 transition"><HelpCircle className="w-16 h-16 text-christmas-gold" /></div>
              <div className="text-center">
                <h2 className="text-3xl font-christmas font-bold mb-2">Quiz Palpite</h2>
                <p className="opacity-80 font-medium">Quem você acha que tirou seu nome?</p>
              </div>
            </button>

            <button onClick={() => setView('playlist')} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white p-8 rounded-3xl shadow-2xl border-4 border-christmas-gold transform hover:-translate-y-2 transition-all flex flex-col items-center gap-6 group">
              <div className="bg-white/20 p-6 rounded-full group-hover:scale-110 transition"><Music className="w-16 h-16 text-christmas-gold" /></div>
              <div className="text-center">
                <h2 className="text-3xl font-christmas font-bold mb-2">Escolha a sua música</h2>
                <p className="opacity-80 font-medium">Busque e toque clipes do YouTube!</p>
              </div>
            </button>
          </div>
        )}

        {view === 'playlist' && (
          <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
             <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl backdrop-blur-lg border border-white/20">
              <button onClick={() => setView('menu')} className="text-white flex items-center gap-2 font-christmas text-xl hover:text-christmas-gold transition">
                <ChevronLeft /> Voltar ao Menu
              </button>
              <h2 className="text-white font-christmas text-3xl animate-christmas-text hidden md:block">YouTube Party Paar</h2>
              <div className="w-32"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Busca e Sugestões */}
                <div className="bg-white rounded-3xl p-8 shadow-2xl border-b-8 border-purple-600">
                  <h3 className="text-2xl font-christmas font-bold text-christmas-dark mb-4 flex items-center gap-2">
                    <Music className="text-purple-600" />
                    Adicionar Música à Fila
                  </h3>

                  <div className="mb-6 space-y-4">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Sugestões Rápidas:</label>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_SUGGESTIONS.map((s, i) => (
                        <button 
                          key={i} 
                          onClick={() => {
                            if (!requesterId) {
                               setMusicError('Selecione quem você é primeiro!');
                               return;
                            }
                            handleAddMusic(s.query);
                          }}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 border border-purple-200"
                        >
                          <span className="text-sm">{s.emoji}</span> {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Quem está pedindo?</label>
                        <select 
                          value={requesterId}
                          onChange={(e) => setRequesterId(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-slate-50 text-gray-900 font-bold focus:border-purple-500 outline-none transition"
                        >
                          <option value="">Selecione seu nome</option>
                          {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Busca YouTube</label>
                        <div className="relative">
                          <input 
                            type="text"
                            value={musicSearchQuery}
                            onChange={(e) => setMusicSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddMusic()}
                            placeholder="Música ou Artista..."
                            className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-100 bg-slate-50 text-gray-900 font-bold focus:border-purple-500 outline-none transition"
                          />
                          <button 
                            onClick={() => handleAddMusic()}
                            disabled={isSearchingMusic || !musicSearchQuery}
                            className="absolute right-2 top-1.5 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                          >
                            {isSearchingMusic ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    {musicError && <p className="text-red-600 text-xs font-bold animate-pulse">⚠️ {musicError}</p>}
                  </div>
                </div>

                {/* Player YouTube */}
                <div className="bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-christmas-gold aspect-video relative group">
                  {currentMusic ? (
                    <iframe 
                      key={currentMusic.id}
                      width="100%" 
                      height="100%" 
                      src={`https://www.youtube.com/embed/${currentMusic.youtubeId}?autoplay=1&mute=0&rel=0&modestbranding=1&enablejsapi=1`} 
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white p-12 text-center bg-gradient-to-br from-purple-900 to-black">
                      <Music className="w-20 h-20 mb-6 opacity-20 animate-pulse" />
                      <h4 className="text-3xl font-christmas font-bold mb-4">Aguardando seu pedido...</h4>
                      <p className="text-purple-300 font-medium italic">Busque uma música para animar a festa do Paar!</p>
                    </div>
                  )}
                  
                  {currentMusic && (
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent flex items-end justify-between group-hover:opacity-100 transition duration-500 pointer-events-none">
                      <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 pointer-events-auto">
                        <span className="bg-christmas-gold text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-block">Tocando agora</span>
                        <h4 className="text-xl font-christmas font-bold text-white leading-tight">{currentMusic.title}</h4>
                        <p className="text-white/70 text-xs">{currentMusic.artist} • <span className="text-christmas-gold font-bold">Por: {currentMusic.requesterName}</span></p>
                      </div>
                      <div className="pointer-events-auto">
                        <button 
                          onClick={() => removeMusicFromDb(currentMusic.id)}
                          className="bg-christmas-red hover:bg-red-700 p-4 rounded-full text-white transition shadow-xl border-2 border-white/20"
                          title="Pular música"
                        >
                          <SkipForward className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fila Direita */}
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-white shadow-2xl flex flex-col h-[600px] lg:h-auto overflow-hidden">
                <h3 className="text-2xl font-christmas font-bold mb-6 flex items-center gap-2 shrink-0">
                  <Play className="text-christmas-gold fill-current" />
                  Próximas ({musicQueue.length})
                </h3>
                
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {musicQueue.length === 0 ? (
                    <div className="text-center py-20 opacity-50 italic">Fila vazia...</div>
                  ) : (
                    musicQueue.map((music, idx) => (
                      <div key={music.id} className={`flex gap-4 p-3 rounded-2xl border-l-4 transition group ${idx === 0 ? 'bg-purple-600/30 border-christmas-gold' : 'bg-white/5 border-purple-400 hover:bg-white/10'}`}>
                        <div className="w-16 h-12 rounded-lg bg-black overflow-hidden shrink-0 relative">
                          <img src={music.thumbnail} alt="thumb" className="w-full h-full object-cover opacity-60" />
                          {idx === 0 && <div className="absolute inset-0 flex items-center justify-center"><Play className="w-5 h-5 text-christmas-gold fill-current animate-pulse" /></div>}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h5 className="font-bold truncate text-sm leading-tight text-white">{music.title}</h5>
                          <p className="text-white/50 text-[10px] truncate mb-1">{music.artist}</p>
                          <div className="flex items-center gap-2 mt-auto">
                            <span className="text-[8px] font-black uppercase text-christmas-gold bg-black/40 px-2 py-0.5 rounded">Por:</span>
                            <span className="text-[10px] font-bold truncate">{music.requesterName}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-between py-1">
                          <span className="text-lg font-christmas text-white/20">#{idx + 1}</span>
                          <button onClick={() => handleRemoveMusic(music.id)} className="p-1.5 hover:bg-red-500/50 rounded-full text-white/30 hover:text-white transition opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LISTA DE PRESENTES */}
        {view === 'gifts' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl backdrop-blur-lg border border-white/20">
              <button onClick={() => setView('menu')} className="text-white flex items-center gap-2 font-christmas text-xl hover:text-christmas-gold transition"><ChevronLeft /> Voltar ao Menu</button>
              <button onClick={() => { setEditingParticipant(undefined); setIsAddParticipantOpen(true); }} className="bg-christmas-red text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition flex items-center gap-2 border-2 border-christmas-gold"><Plus className="w-5 h-5" /> Entrar na Lista</button>
            </div>
            {participants.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 text-center text-white border border-white/20 max-w-2xl mx-auto">
                <p className="text-3xl font-christmas mb-2 animate-christmas-text">Ninguém chegou ainda...</p>
                <p>Seja o primeiro a pedir seu presente!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {participants.map(p => <ParticipantCard key={p.id} participant={p} onClick={() => setSelectedParticipantId(p.id)} />)}
              </div>
            )}
          </div>
        )}

        {/* LISTA DE COMIDAS */}
        {view === 'food' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl backdrop-blur-lg border border-white/20">
              <button onClick={() => setView('menu')} className="text-white flex items-center gap-2 font-christmas text-xl hover:text-christmas-gold transition"><ChevronLeft /> Voltar ao Menu</button>
              <button onClick={() => { setEditingFood(undefined); setIsAddFoodOpen(true); }} className="bg-christmas-green text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition flex items-center gap-2 border-2 border-christmas-gold"><Plus className="w-5 h-5" /> Adicionar Prato</button>
            </div>
            {foodItems.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 text-center text-white border border-white/20 max-w-2xl mx-auto">
                <Utensils className="w-16 h-16 mx-auto mb-4 opacity-50" /><p className="text-3xl font-christmas mb-2">A mesa está vazia!</p>
              </div>
            ) : (
              <div className="bg-black/20 backdrop-blur-sm p-4 md:p-8 rounded-3xl border border-white/10 shadow-inner grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {foodItems.map(f => (
                  <div key={f.id} onClick={() => { setEditingFood(f); setIsAddFoodOpen(true); }} className="group bg-white rounded-3xl overflow-hidden shadow-2xl border-t-8 border-christmas-green transform hover:-translate-y-2 transition duration-300 cursor-pointer">
                    <div className="aspect-video relative overflow-hidden">
                      <img src={f.image} className="w-full h-full object-cover transition group-hover:scale-110" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 p-4 text-white"><h3 className="text-2xl font-christmas font-bold">{f.name}</h3></div>
                    </div>
                    <div className="p-5 space-y-3 bg-white">
                      <p className="text-gray-600 italic text-sm">"{f.caption || "Sem descrição"}"</p>
                      <p className="text-christmas-green font-bold text-sm">Chef: {f.contributorName}</p>
                    </div>
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
              <button onClick={() => setView('menu')} className="text-white flex items-center gap-2 font-christmas text-xl hover:text-christmas-gold transition"><ChevronLeft /> Voltar ao Menu</button>
              <h2 className="text-white font-christmas text-3xl animate-christmas-text hidden md:block">Quem tirou você?</h2>
              <div className="w-32"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-8 shadow-2xl border-b-8 border-blue-600">
                <h3 className="text-2xl font-christmas font-bold text-christmas-dark mb-6 flex items-center gap-2"><UserCheck className="text-blue-600" />{existingVote ? 'Atualizar seu Palpite' : 'Dê o seu Palpite'}</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-black text-gray-500 mb-2 uppercase">Quem é você?</label>
                    <select value={voterId} onChange={(e) => { setVoterId(e.target.value); const v = votes.find(v => v.id === e.target.value); setGuessId(v ? v.guessId : ''); }} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-slate-50 text-gray-900 font-bold outline-none">
                      <option value="">Selecione seu nome</option>
                      {participants.map(p => <option key={p.id} value={p.id}>{p.name} {hasVoted(p.id) ? ' (Já palpitou)' : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-500 mb-2 uppercase">Palpite</label>
                    <select value={guessId} onChange={(e) => setGuessId(e.target.value)} disabled={!voterId} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-slate-50 text-gray-900 font-bold outline-none disabled:opacity-50">
                      <option value="">{voterId ? 'Selecione um palpite' : 'Selecione quem você é primeiro'}</option>
                      {participants.filter(p => p.id !== voterId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <button onClick={handleCastVote} disabled={!voterId || !guessId || isVoting} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50">{isVoting ? <Sparkles className="animate-spin" /> : "Votar agora!"}</button>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-white shadow-2xl h-fit">
                <h3 className="text-2xl font-christmas font-bold mb-6 flex items-center gap-2"><CheckCircle2 className="text-christmas-gold" />Palpites da Galera</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {votes.length === 0 ? <div className="text-center py-12 opacity-50 italic">Ainda não temos palpites...</div> : votes.map((v, i) => (
                    <div key={i} className="bg-white/10 p-4 rounded-xl flex items-center justify-between border-l-4 border-christmas-gold group relative">
                      <div className="flex flex-col">
                        <span className="text-christmas-gold font-bold text-[10px] uppercase">Palpite de:</span>
                        <span className="font-christmas text-lg leading-none">{v.voterName}</span>
                      </div>
                      <div className="text-right flex flex-col">
                        <span className="text-white/60 font-bold text-[10px] uppercase">Acha que foi:</span>
                        <span className="font-christmas text-lg text-blue-300 leading-none">{v.guessName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="relative z-10 py-8 text-center text-white/60 text-sm font-christmas text-lg">
        <p className="animate-sway-only">© {new Date().getFullYear()} Galera do Paar. Desenvolvido por Diogenes Araujo.</p>
        <p className="text-xs mt-2 opacity-50">{isFirebaseConfigured ? "🟢 Conectado ao Polo Norte" : "⚪ Modo Local (Offline)"}</p>
      </footer>

      {isAddParticipantOpen && <AddParticipantModal onClose={() => setIsAddParticipantOpen(false)} onSave={handleSaveParticipant} initialData={editingParticipant} />}
      {isAddFoodOpen && <AddFoodModal key={editingFood ? editingFood.id : 'new-food'} existingFoods={foodItems} onClose={() => { setIsAddFoodOpen(false); setEditingFood(undefined); }} onSave={handleSaveFood} initialData={editingFood} />}
      {activeParticipant && <GiftDisplayModal participant={activeParticipant} onClose={() => setSelectedParticipantId(null)} onEdit={(p) => { setSelectedParticipantId(null); setEditingParticipant(p); setIsAddParticipantOpen(true); }} />}

    </div>
  );
};

export default App;