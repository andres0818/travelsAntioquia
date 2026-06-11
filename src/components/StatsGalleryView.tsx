import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Award, Image as ImageIcon, Camera, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { REGIONS_MAPPING, SUBREGIONS } from '../data/regions';

interface StatsGalleryViewProps {
  type: 'stats' | 'gallery';
  onClose: () => void;
  visitedTownIds: string[];
}

const StatsGalleryView: React.FC<StatsGalleryViewProps> = ({ type, onClose, visitedTownIds }) => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (type === 'gallery') {
      fetchGallery();
    }
  }, [type]);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('visit_photos')
        .select('*, visit:visits(town_name)')
        .order('created_at', { ascending: false });
      if (data) setPhotos(data);
    } catch (err) {
      console.error('Error fetching gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  const visitedCount = visitedTownIds.length;

  const stats = useMemo(() => {
    const regionStats = SUBREGIONS.map(name => ({
      name,
      total: Object.values(REGIONS_MAPPING).filter(r => r === name).length,
      visited: visitedTownIds.filter(id => REGIONS_MAPPING[id] === name).length
    }));
    return regionStats;
  }, [visitedTownIds]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="fixed inset-0 z-[100] bg-black p-4 md:p-12 overflow-y-auto custom-scrollbar"
    >
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <div className="bg-emerald-500 p-4 rounded-3xl text-black shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              {type === 'stats' ? <Award size={32} /> : <ImageIcon size={32} />}
            </div>
            <div>
              <h2 className="text-5xl font-black italic uppercase tracking-tighter gta-text-shadow">
                {type === 'stats' ? 'Career Stats' : 'World Gallery'}
              </h2>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-500">
                {type === 'stats' ? 'Your progress in Antioquia' : 'All your memories in one place'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10"
          >
            <X size={24} />
          </button>
        </div>

        {type === 'stats' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div className="glass rounded-[2.5rem] p-8 grid grid-cols-1 sm:grid-cols-2 gap-8 border-l-8 border-l-emerald-500">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Total Progress</p>
                  <p className="text-6xl font-black italic">{visitedCount}<span className="text-2xl text-white/20 ml-2">/ 125</span></p>
                </div>
                <div className="flex flex-col justify-center">
                   <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(visitedCount/125)*100}%` }}
                        className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                      />
                   </div>
                   <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mt-4">
                     {125 - visitedCount} municipalities remaining to complete the mission
                   </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {stats.map((region, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={region.name} 
                    className="glass rounded-3xl p-6 flex items-center justify-between group hover:bg-white/10 transition-all cursor-default"
                  >
                    <div>
                      <h4 className="font-bold text-white/90 group-hover:text-emerald-400 transition-colors">{region.name}</h4>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-white/30">{region.total} Municipios</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black italic">{region.visited}</span>
                      <span className="text-[10px] font-bold text-white/20 ml-1">VISITED</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/20 px-4">Unlocked Badges</h3>
               <div className="glass rounded-[2.5rem] p-8 space-y-8">
                  <div className={cn("flex items-center gap-4 transition-opacity", visitedCount < 1 && "opacity-20 grayscale")}>
                    <div className="p-3 bg-yellow-500/20 text-yellow-500 rounded-2xl border border-yellow-500/20">
                      <Camera size={24} />
                    </div>
                    <div>
                      <p className="font-black italic uppercase leading-none">First Memory</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">Upload your first photo</p>
                    </div>
                  </div>
                  <div className={cn("flex items-center gap-4 transition-opacity", visitedCount < 10 && "opacity-20 grayscale")}>
                    <div className="p-3 bg-blue-500/20 text-blue-500 rounded-2xl border border-blue-500/20">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <p className="font-black italic uppercase leading-none">Rising Star</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">Visit 10 towns</p>
                    </div>
                  </div>
                  <div className={cn("flex items-center gap-4 transition-opacity", visitedCount < 125 && "opacity-20 grayscale")}>
                    <div className="p-3 bg-purple-500/20 text-purple-500 rounded-2xl border border-purple-500/20">
                      <Award size={24} />
                    </div>
                    <div>
                      <p className="font-black italic uppercase leading-none">Antioquia God</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">Complete all 125 towns</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
              </div>
            ) : photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 opacity-20">
                <Camera size={80} strokeWidth={1} className="mb-4" />
                <p className="text-2xl font-black uppercase italic">No evidence found yet</p>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {photos.map((photo, i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={photo.id}
                    className="relative group rounded-3xl overflow-hidden break-inside-avoid border border-white/5"
                  >
                    <img 
                      src={photo.image_url} 
                      className="w-full hover:scale-105 transition-transform duration-700"
                      alt={photo.visit?.town_name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Location</p>
                      <p className="text-2xl font-black italic uppercase">{photo.visit?.town_name}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatsGalleryView;
