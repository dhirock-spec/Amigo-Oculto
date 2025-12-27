import React from 'react';
import { Participant } from '../types';

interface Props {
  participant: Participant;
  onClick: () => void;
}

const ParticipantCard: React.FC<Props> = ({ participant, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative bg-white p-4 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border-2 border-transparent hover:border-christmas-gold overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
        <span className="text-2xl">🎁</span>
      </div>
      
      <div className="aspect-square rounded-full overflow-hidden border-4 border-christmas-green/20 group-hover:border-christmas-red transition-colors mx-auto w-32 h-32 mb-4 bg-gray-100">
        <img 
          src={participant.avatar} 
          alt={participant.name} 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="text-center">
        <h3 className="font-serif font-bold text-xl text-christmas-dark truncate">{participant.name}</h3>
        <p className="text-xs text-christmas-red font-medium uppercase tracking-wider mt-1">
          {participant.wishes.filter(w => w.title).length} Sugestões Listadas
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-christmas-green via-christmas-red to-christmas-green transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
    </div>
  );
};

export default ParticipantCard;