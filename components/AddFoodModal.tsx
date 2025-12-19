import React, { useState, useRef } from 'react';
import { FoodItem } from '../types';
import { X, Upload, Utensils, Loader2, Camera } from 'lucide-react';
import { compressImage } from '../utils/imageUtils';

interface Props {
  existingFoods: FoodItem[];
  onClose: () => void;
  onSave: (food: FoodItem) => Promise<void>;
}

const AddFoodModal: React.FC<Props> = ({ existingFoods, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 600, 0.6);
        setImage(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !image || !contributorName) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const isDuplicate = existingFoods.some(f => f.name.toLowerCase().trim() === name.toLowerCase().trim());
    if (isDuplicate) {
      setError('Epa! Alguém já vai trazer esse prato. Escolha outra delícia!');
      return;
    }

    setIsSaving(true);
    const newFood: FoodItem = {
      id: crypto.randomUUID(),
      name,
      caption,
      image,
      contributorName,
      contributorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${contributorName}`
    };

    await onSave(newFood);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-christmas-cream w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-christmas-green p-4 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold font-christmas flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            O que você vai trazer?
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 text-sm font-bold animate-bounce">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Seu Nome</label>
            <input 
              type="text" 
              value={contributorName}
              onChange={e => setContributorName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-christmas-green outline-none"
              placeholder="Quem é o chef?"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Nome do Prato (Não pode repetir!)</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-christmas-green outline-none"
              placeholder="Ex: Arroz à Grega, Peru, Farofa..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Legenda / Detalhes</label>
            <textarea 
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-christmas-green outline-none h-20 resize-none"
              placeholder="Diga algo sobre sua obra-prima..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Foto da Comida</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-video rounded-xl border-4 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-christmas-green overflow-hidden bg-white group"
            >
              {image ? (
                <img src={image} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-gray-400">
                  <Camera className="w-10 h-10 mx-auto mb-2" />
                  <span className="text-xs font-bold">Tirar ou Enviar Foto</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-christmas-green text-white font-bold rounded-xl shadow-lg hover:bg-green-800 transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : 'Confirmar no Menu!'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddFoodModal;