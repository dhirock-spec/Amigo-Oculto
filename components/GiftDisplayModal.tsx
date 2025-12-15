import React from 'react';
import { Participant } from '../types';
import { X, ExternalLink, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  participant: Participant | null;
  onClose: () => void;
  onEdit: (participant: Participant) => void;
}

const GiftDisplayModal: React.FC<Props> = ({ participant, onClose, onEdit }) => {
  if (!participant) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-christmas-dark/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-christmas-cream w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative bg-christmas-green p-8 text-center text-white overflow-hidden shrink-0">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/snow.png')]"></div>
            
            <div className="absolute top-4 right-4 flex gap-2 z-20">
              <button 
                onClick={() => onEdit(participant)}
                className="p-2 bg-christmas-gold/80 hover:bg-christmas-gold text-christmas-dark rounded-full transition shadow-lg flex items-center gap-1 px-3 font-bold text-sm"
                title="Editar Participante"
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>
              <button 
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full border-4 border-christmas-gold overflow-hidden shadow-lg bg-white">
                <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-3xl font-serif font-bold">Lista de Desejos de {participant.name}</h2>
                <p className="text-white/80 max-w-lg mx-auto mt-2 italic">"{participant.interests}"</p>
              </div>
            </div>
          </div>

          {/* Gifts Grid */}
          <div className="p-8 overflow-y-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {participant.wishes.map((gift) => (
                <div key={gift.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden group hover:shadow-xl transition flex flex-col">
                  <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                    {gift.image ? (
                      <img 
                        src={gift.image} 
                        alt={gift.title} 
                        className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                        Sem Imagem
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-christmas-dark mb-2">{gift.title || "Presente Surpresa"}</h3>
                    <p className="text-gray-600 text-sm flex-1">{gift.description || "Nenhuma descrição fornecida."}</p>
                    
                    {gift.title && (
                      <a 
                        href={`https://www.google.com/search?q=${encodeURIComponent(gift.title + ' comprar online')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center justify-center gap-2 w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Encontrar Online
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GiftDisplayModal;