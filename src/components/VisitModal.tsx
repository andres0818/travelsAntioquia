import React, { useState, useEffect } from 'react';
import { X, Star, Upload, Trash2, CheckCircle2, MapPin, Calendar, Award, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface VisitModalProps {
  townId: string;
  townName: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface VisitData {
  id?: string;
  description: string;
  rating: number;
}

interface Photo {
  id: string;
  image_url: string;
  is_main: boolean;
}

const VisitModal: React.FC<VisitModalProps> = ({ townId, townName, onClose, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [visit, setVisit] = useState<VisitData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    fetchVisitData();
  }, [townId]);

  const fetchVisitData = async () => {
    try {
      const { data: visitData } = await supabase
        .from('visits')
        .select('*')
        .eq('town_id', townId)
        .maybeSingle();

      if (visitData) {
        setVisit(visitData);
        setDescription(visitData.description || '');
        setRating(visitData.rating || 5);

        const { data: photosData } = await supabase
          .from('visit_photos')
          .select('*')
          .eq('visit_id', visitData.id);

        if (photosData) setPhotos(photosData);
      } else {
        setVisit(null);
        setDescription('');
        setRating(5);
        setPhotos([]);
      }
    } catch (err) {
      console.error('Error fetching visit data:', err);
    }
  };

  const handleRatingClick = async (newRating: number) => {
    setRating(newRating);
    try {
      if (visit) {
        await supabase
          .from('visits')
          .update({ rating: newRating })
          .eq('id', visit.id);
      } else {
        const { data } = await supabase
          .from('visits')
          .insert([{ town_id: townId, town_name: townName, rating: newRating, description: '' }])
          .select()
          .single();
        
        if (data) setVisit(data);
      }
      onUpdate();
    } catch (err) {
      console.error('Error auto-saving rating:', err);
    }
  };

  const handleSaveDescription = async () => {
    try {
      if (visit) {
        await supabase
          .from('visits')
          .update({ description })
          .eq('id', visit.id);
      } else {
        const { data } = await supabase
          .from('visits')
          .insert([{ town_id: townId, town_name: townName, description, rating }])
          .select()
          .single();
        
        if (data) setVisit(data);
      }
      onUpdate();
    } catch (err) {
      console.error('Error saving description:', err);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    let currentVisit = visit;

    if (!currentVisit) {
      try {
        const { data } = await supabase
          .from('visits')
          .insert([{ town_id: townId, town_name: townName, description: '', rating: 5 }])
          .select()
          .single();
        if (data) {
          currentVisit = data;
          setVisit(data);
        }
      } catch (err) {
        console.error('Error creating visit for photo:', err);
        return;
      }
    }

    if (!currentVisit) return;

    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${townId}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('town_photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('town_photos')
        .getPublicUrl(filePath);

      await supabase.from('visit_photos').insert([
        { visit_id: currentVisit.id, image_url: publicUrl, is_main: photos.length === 0 }
      ]);

      fetchVisitData();
      onUpdate();
    } catch (err) {
      console.error('Error uploading photo:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string, imageUrl: string) => {
    try {
      const path = imageUrl.split('town_photos/')[1];
      await supabase.storage.from('town_photos').remove([path]);
      await supabase.from('visit_photos').delete().eq('id', photoId);
      fetchVisitData();
    } catch (err) {
      console.error('Error deleting photo:', err);
    }
  };

  const handleSetMainPhoto = async (photoId: string) => {
    if (!visit) return;
    try {
      await supabase
        .from('visit_photos')
        .update({ is_main: false })
        .eq('visit_id', visit.id);
      
      await supabase
        .from('visit_photos')
        .update({ is_main: true })
        .eq('id', photoId);
      
      fetchVisitData();
      onUpdate();
    } catch (err) {
      console.error('Error setting main photo:', err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 z-[100] overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#1c1c1e] border border-white/10 rounded-[2.5rem] max-w-4xl w-full shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row h-full max-h-[85vh]"
      >
        {/* Left Side: Visuals & Photos */}
        <div className="md:w-1/2 bg-black relative group overflow-hidden">
          {photos.length > 0 ? (
            <img 
              src={photos.find(p => p.is_main)?.image_url || photos[0].image_url} 
              className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/20 p-12 text-center">
              <ImageIcon size={80} strokeWidth={1} className="mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">Sin memorias visuales aún</p>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          
          <div className="absolute bottom-8 left-8 right-8">
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-2 gta-text-shadow"
            >
              {townName}
            </motion.h2>
            <div className="flex items-center gap-4 text-emerald-400 font-bold text-xs uppercase tracking-[0.2em]">
              <span className="flex items-center gap-1"><MapPin size={12}/> Antioquia</span>
              <span className="flex items-center gap-1"><Calendar size={12}/> {visit ? 'Visitado' : 'Pendiente'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form & Gallery */}
        <div className="md:w-1/2 p-8 overflow-y-auto custom-scrollbar bg-[#1c1c1e]">
          <div className="flex justify-end mb-4">
             <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                <X size={20} />
             </button>
          </div>

          <div className="space-y-10">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-4 border-l-4 border-emerald-500">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Status</p>
                <p className="text-sm font-black uppercase italic">{visit ? 'COMPLETED' : 'IN PROGRESS'}</p>
              </div>
              <div className="glass rounded-2xl p-4 border-l-4 border-yellow-500">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Score</p>
                <div className="flex -ml-1">
                  {[1,2,3,4,5].map(s => (
                    <button
                      key={s}
                      onMouseEnter={() => setHoveredRating(s)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => handleRatingClick(s)}
                      className="p-1 transition-transform hover:scale-110 active:scale-90 outline-none group"
                    >
                      <Star 
                        size={18} 
                        className={cn(
                          "transition-all duration-150",
                          s <= (hoveredRating || rating) 
                            ? "fill-yellow-500 text-yellow-500" 
                            : "text-yellow-500/30 group-hover:text-yellow-500/60"
                        )} 
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Experience Section */}
            <section className="space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">The Story</h3>
                  <Award size={16} className="text-emerald-500" />
               </div>
               <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about the mission..."
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-medium focus:bg-white/10 focus:ring-2 focus:ring-emerald-500 transition-all outline-none min-h-[100px] resize-none"
               />
               <button
                  onClick={handleSaveDescription}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:scale-95"
               >
                  Update Mission Log
               </button>
            </section>

            {/* Photos Section */}
            <section className="space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Evidence</h3>
                  <label className="cursor-pointer p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-black transition-all">
                    <Upload size={16} />
                    <input type="file" accept="image/*" onChange={handleUploadPhoto} className="hidden" disabled={uploading} />
                  </label>
               </div>
               
               <div className="grid grid-cols-3 gap-3">
                  {photos.map(p => (
                    <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden group border border-white/5">
                      <img src={p.image_url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                        <button onClick={() => handleSetMainPhoto(p.id)} className={cn("p-1.5 rounded-lg", p.is_main ? "bg-emerald-500 text-black" : "bg-white/20")}>
                          <CheckCircle2 size={14} />
                        </button>
                        <button onClick={() => handleDeletePhoto(p.id, p.image_url)} className="p-1.5 bg-red-500/80 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
               </div>
            </section>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VisitModal;
