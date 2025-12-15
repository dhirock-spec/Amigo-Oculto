import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';

const PLAYLIST = [
  {
    title: "Jingle Bells",
    artist: "Kevin MacLeod",
    src: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Jingle_Bells_-_Kevin_MacLeod.ogg"
  },
  {
    title: "Deck the Halls",
    artist: "Kevin MacLeod",
    src: "https://upload.wikimedia.org/wikipedia/commons/8/89/Deck_the_Halls_-_Kevin_MacLeod.ogg"
  },
  {
    title: "We Wish You a Merry Christmas",
    artist: "Kevin MacLeod",
    src: "https://upload.wikimedia.org/wikipedia/commons/9/9b/We_Wish_You_a_Merry_Christmas_-_Kevin_MacLeod.ogg"
  }
];

const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Autoplay blocked:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % PLAYLIST.length);
    setIsPlaying(true);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleEnded = () => {
    nextTrack();
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-end gap-2">
      <audio
        ref={audioRef}
        src={PLAYLIST[currentTrack].src}
        onEnded={handleEnded}
      />

      {/* Main Player Bubble */}
      <div 
        className={`bg-christmas-red text-white rounded-full shadow-2xl transition-all duration-300 ease-in-out border-2 border-christmas-gold overflow-hidden flex items-center ${isExpanded ? 'w-72 p-2' : 'w-12 h-12 p-0 justify-center'}`}
      >
        {/* Collapsed Icon */}
        {!isExpanded && (
          <button onClick={() => setIsExpanded(true)} className="w-full h-full flex items-center justify-center hover:bg-red-700 transition rounded-full">
            <Music className={`w-6 h-6 ${isPlaying ? 'animate-pulse' : ''}`} />
          </button>
        )}

        {/* Expanded Controls */}
        {isExpanded && (
          <div className="flex items-center w-full gap-3 px-2">
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-2 bg-red-800 rounded-full hover:bg-red-900 transition shrink-0"
            >
              <Music className="w-4 h-4" />
            </button>
            
            <div className="flex-1 overflow-hidden min-w-0">
              <p className="text-xs font-bold truncate text-christmas-gold">{PLAYLIST[currentTrack].title}</p>
              <p className="text-[10px] truncate opacity-80">{PLAYLIST[currentTrack].artist}</p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button onClick={togglePlay} className="p-2 hover:bg-white/20 rounded-full transition">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>
              <button onClick={nextTrack} className="p-2 hover:bg-white/20 rounded-full transition">
                <SkipForward className="w-4 h-4" />
              </button>
              <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-full transition">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicPlayer;
