
import React, { useState, useRef } from 'react';
import { Gift, Participant } from '../types';
import { X, Upload, Image as ImageIcon, Gift as GiftIcon, Save, Trash2, Loader2 } from 'lucide-react';
import { compressImage } from '../utils/imageUtils';

interface Props {
  onClose: () => void;
  onSave: (p: Participant) => Promise<void>;
  initialData?: Participant;
}

const AddParticipantModal: React.FC<Props> = ({ onClose, onSave, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [avatar, setAvatar] = useState<string>(initialData?.avatar || '');
  const [wishes, setWishes] = useState<Gift[]>(
    initialData?.wishes || [
      { id: '1', title: '', description: '', image: '' },
      { id: '2', title: '', description: '', image: '' },
      { id: '3', title: '', description: '', image: '' },
    ]
  );
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const wishFileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          // Compress avatar to ~150px (small icon)
          const compressed = await compressImage(reader.result as string, 300, 0.7);
          setAvatar(compressed);
        } catch (err) {
          console.error("Erro ao comprimir imagem", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWishImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          // Compress wish image to ~600px
          const compressed = await compressImage(reader.result as string, 600, 0.6);
          setWishes(prev => {
            const newWishes = [...prev];
            newWishes[index] = { ...newWishes[index], image: compressed };
            return newWishes;
          });
        } catch (err) {
          console.error("Erro ao comprimir imagem", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveWishImage = (index: number) => {
    setWishes(prev => {
      const newWishes = [...prev];
      newWishes[index] = { ...newWishes[index], image: '' };
      return newWishes;
    });
    // Reset file input
    if (wishFileRefs.current[index]) {
      wishFileRefs.current[index]!.value = '';
    }
  };

  const updateWishField = (index: number, field: keyof Gift, value: string) => {
    setWishes(prev => {
      const newWishes = [...prev];
      newWishes[index] = { ...newWishes[index], [field]: value };
      return newWishes;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !avatar) return;

    setIsSaving(true);
    const participantData: Participant = {
      // If we have initialData, keep the ID (update), otherwise generate new ID
      id: initialData?.id || crypto.randomUUID(),
      name,
      avatar,
      interests: initialData?.interests || '', 
      wishes
    };
    
    await onSave(participantData);
    setIsSaving(false);
  };

  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-christmas-cream w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-christmas-red p-4 flex justify-between items-center text-white shadow-md z-10">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2">
            <GiftIcon className="w-5 h-5" />
            {isEditing ? 'Editar Participante' : 'Participe da Lista'}
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-8 flex-1 bg-slate-50">
          
          {/* Step 1: Identity */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-christmas-dark border-b-2 border-christmas-gold/50 pb-2">1. Quem é você?</h3>
            <div className="flex gap-4 items-start">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 shrink-0 rounded-full bg-white border-4 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-christmas-red overflow-hidden relative group shadow-sm transition-colors"
              >
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-christmas-red" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold backdrop-blur-[1px]">
                  {avatar ? 'Trocar Foto' : 'Enviar Foto'}
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-800 mb-1">Seu Nome</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-christmas-red focus:border-christmas-red outline-none shadow-sm placeholder:text-gray-400"
                  placeholder="Ex: Papai Noel"
                />
              </div>
            </div>
          </section>

          {/* Step 2: Wishes */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-christmas-dark border-b-2 border-christmas-gold/50 pb-2">2. Seus 3 Principais Desejos</h3>
            
            <div className="grid gap-6 md:grid-cols-3">
              {wishes.map((wish, idx) => (
                <div key={wish.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-200 flex flex-col gap-3 relative hover:shadow-lg transition-shadow">
                  <div className="relative w-full aspect-square bg-slate-100 rounded-lg overflow-hidden border border-gray-200 group">
                    {wish.image ? (
                      <>
                        <img src={wish.image} alt="Wish" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveWishImage(idx);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm z-20 hover:bg-red-700"
                          title="Remover imagem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                         <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                         <span className="text-xs font-medium">Sem Imagem</span>
                      </div>
                    )}
                    
                    {/* Image Controls Overlay - Visible on Hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 p-3 backdrop-blur-[1px] z-10">
                       <button 
                         type="button"
                         onClick={() => wishFileRefs.current[idx]?.click()}
                         className="px-3 py-2 bg-white text-christmas-dark text-xs font-bold rounded-lg shadow-lg hover:bg-gray-100 w-full"
                       >
                         {wish.image ? 'Trocar Foto' : 'Enviar Foto'}
                       </button>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    ref={el => { wishFileRefs.current[idx] = el; }}
                    onChange={(e) => handleWishImageUpload(idx, e)}
                  />
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Presente</label>
                      <input 
                        type="text" 
                        placeholder="Nome do Presente" 
                        value={wish.title}
                        onChange={(e) => updateWishField(idx, 'title', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-900 text-sm focus:bg-white focus:border-christmas-red focus:ring-1 focus:ring-christmas-red outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Detalhes</label>
                      <textarea 
                        placeholder="Breve descrição..." 
                        value={wish.description}
                        onChange={(e) => updateWishField(idx, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 resize-none h-16 focus:bg-white focus:border-christmas-red focus:ring-1 focus:ring-christmas-red outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="bg-white p-4 border-t border-gray-200 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
          <button onClick={onClose} disabled={isSaving} className="px-5 py-2 rounded-lg text-gray-700 font-bold hover:bg-gray-100 transition disabled:opacity-50">
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!name || !avatar || isSaving}
            className="px-6 py-2 rounded-lg bg-christmas-red text-white font-bold shadow-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform active:scale-95"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : isEditing ? (
              <>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </>
            ) : (
              'Entrar na Lista'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddParticipantModal;
