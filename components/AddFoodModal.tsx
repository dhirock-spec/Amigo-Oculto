import React, { useState, useRef, useEffect } from 'react';
import { FoodItem } from '../types';
import { X, Upload, Utensils, Loader2, Camera, Save } from 'lucide-react';
import { compressImage } from '../utils/imageUtils';

interface Props {
  existingFoods: FoodItem[];
  onClose: () => void;
  onSave: (food: FoodItem) => Promise<void>;
  initialData?: FoodItem;
}

const AddFoodModal: React.FC<Props> = ({ existingFoods, onClose, onSave, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [caption, setCaption] = useState(initialData?.caption || '');
  const [image, setImage] = useState(initialData?.image || '');
  const [contributorName, setContributorName] = useState(initialData?.contributorName || '');
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

    // Verifica duplicidade excluindo o item atual caso seja edição
    const isDuplicate = existingFoods.some(f => 
      f.name.toLowerCase().trim() === name.toLowerCase().trim() && f.id !== initialData?.id
    );
    
    if (isDuplicate) {
      setError('Epa! Alguém já vai trazer esse prato. Escolha outra delícia!');
      return;
    }

    setIsSaving(true);
    const foodData: FoodItem = {
      id: initialData?.id || crypto.randomUUID(),
      name,
      caption,
      image,
      contributorName,
      contributorAvatar: initialData?.contributorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contributorName}`
    };

    await onSave(foodData);
    setIsSaving(false);
  };

  const isEditing = !!initialData;

  // Estilo comum para os inputs para garantir legibilidade
  const inputClassName = "w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-christmas-dark font-medium focus:border-christmas-green focus:ring-4 focus:ring-christmas-green/10 outline-none transition-all shadow-sm placeholder:text-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border-4 border-christmas-gold">
        
        {/* Header - Mais vibrante e festivo */}
        <div className="bg-christmas-green p-5 flex justify-between items-center text-white shadow-lg relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/snow.png')]"></div>
          <h2 className="text-2xl font-bold font-christmas flex items-center gap-3 relative z-10">
            <Utensils className="w-6 h-6 text-christmas-gold" />
            {isEditing ? 'Editar seu Prato' : 'Sua Contribuição'}
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors relative z-10">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 bg-slate-50">
          {error && (
            <div className="bg-red-50 border-2 border-red-500 text-red-700 p-4 rounded-xl text-sm font-bold animate-pulse flex items-center gap-2">
              <span className="text-xl">⚠️</span> {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-black text-christmas-green uppercase tracking-wider ml-1">Seu Nome / Chef</label>
            <input 
              type="text" 
              value={contributorName}
              onChange={e => setContributorName(e.target.value)}
              className={inputClassName}
              placeholder="Ex: Diógenes Araújo"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-black text-christmas-green uppercase tracking-wider ml-1">Nome do Prato</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputClassName}
              placeholder="Ex: Arroz à Grega do Paar"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-black text-christmas-green uppercase tracking-wider ml-1">Legenda (Opcional)</label>
            <textarea 
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className={`${inputClassName} h-24 resize-none`}
              placeholder="Uma pitada de amor e segredos da vovó..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-christmas-green uppercase tracking-wider ml-1">Foto da Delícia</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-video rounded-2xl border-4 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-christmas-green hover:bg-white overflow-hidden bg-gray-100 group transition-all"
            >
              {image ? (
                <img src={image} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-gray-400 group-hover:text-christmas-green transition-colors">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50 group-hover:opacity-100" />
                  <span className="text-xs font-black uppercase tracking-widest">Enviar Foto do Prato</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition backdrop-blur-sm">
                 <span className="bg-white text-christmas-dark px-4 py-2 rounded-full text-xs font-black shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                   {image ? 'Trocar Foto' : 'Selecionar Imagem'}
                 </span>
              </div>
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={isSaving}
              className={`w-full py-4 ${isEditing ? 'bg-christmas-gold hover:bg-yellow-600' : 'bg-christmas-green hover:bg-green-800'} text-white font-black text-lg rounded-2xl shadow-[0_8px_0_rgb(0,0,0,0.1)] hover:shadow-none hover:translate-y-1 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest`}
            >
              {isSaving ? (
                <Loader2 className="animate-spin w-6 h-6" />
              ) : isEditing ? (
                <><Save className="w-6 h-6" /> Salvar Mudanças</>
              ) : (
                <><Utensils className="w-6 h-6" /> Confirmar Prato</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFoodModal;