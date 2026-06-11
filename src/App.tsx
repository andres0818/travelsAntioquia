import { useState, useEffect } from 'react'
import MapAntioquia from './components/MapAntioquia'
import VisitModal from './components/VisitModal'
import StatsGalleryView from './components/StatsGalleryView'
import { supabase } from './lib/supabase'
import { cn } from './lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Map as MapIcon, Compass, Award, Image as ImageIcon } from 'lucide-react'

function App() {
  const [selectedTown, setSelectedTown] = useState<{ id: string, name: string } | null>(null)
  const [visitedTowns, setVisitedTowns] = useState<Record<string, { mainImageUrl: string }>>({})
  const [hoveredTown, setHoveredTown] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'map' | 'stats' | 'gallery'>('map')

  useEffect(() => {
    fetchVisitedTowns()
  }, [])

  const fetchVisitedTowns = async () => {
    try {
      const { data } = await supabase
        .from('visit_photos')
        .select('image_url, visit:visits(town_id)')
        .eq('is_main', true)

      if (data) {
        const mapping: Record<string, { mainImageUrl: string }> = {}
        data.forEach((item: any) => {
          if (item.visit && item.visit.town_id) {
            mapping[item.visit.town_id] = { mainImageUrl: item.image_url }
          }
        })
        setVisitedTowns(mapping)
      }
    } catch (err) {
      console.error('Error fetching visited towns:', err)
    }
  }

  const progress = Math.round((Object.keys(visitedTowns).length / 125) * 100)

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 overflow-hidden">
      {/* Immersive Background Overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05)_0%,rgba(0,0,0,1)_100%)] pointer-events-none" />

      {/* GTA V Style HUD - Top Left */}
      <div className="fixed top-8 left-8 z-40 flex flex-col gap-2">
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-black/80 backdrop-blur-md border-l-4 border-emerald-500 px-6 py-3 flex items-center gap-4 shadow-2xl"
        >
          <div className="bg-emerald-500 p-2 rounded-full text-black">
            <Compass size={24} className="animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">
              Antioquia <span className="text-emerald-500">Explorer</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mt-1">
              Mission: Visit all 125 towns
            </p>
          </div>
        </motion.div>
        
        {/* Progress HUD */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-black/80 backdrop-blur-md border-l-4 border-white/20 px-6 py-2 flex items-center gap-4"
        >
          <div className="text-2xl font-black italic text-white/90">
            {progress}%
          </div>
          <div className="flex-1 h-1 bg-white/10 w-32 relative overflow-hidden">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      </div>

      {/* Apple Style Floating Dock - Bottom */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110]">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass rounded-3xl px-6 py-3 flex items-center gap-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          <div 
            onClick={() => setActiveView('map')}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className={cn(
              "p-3 rounded-2xl transition-all",
              activeView === 'map' ? "bg-emerald-500 text-black" : "bg-white/10 group-hover:bg-white/20"
            )}>
              <MapIcon size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Map</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div 
            onClick={() => setActiveView('stats')}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className={cn(
              "p-3 rounded-2xl transition-all",
              activeView === 'stats' ? "bg-emerald-500 text-black" : "bg-white/10 group-hover:bg-white/20"
            )}>
              <Award size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Stats</span>
          </div>
          <div 
            onClick={() => setActiveView('gallery')}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className={cn(
              "p-3 rounded-2xl transition-all",
              activeView === 'gallery' ? "bg-emerald-500 text-black" : "bg-white/10 group-hover:bg-white/20"
            )}>
              <ImageIcon size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Gallery</span>
          </div>
        </motion.div>
      </div>

      <main className="relative z-10 w-full h-screen flex items-center justify-center p-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-6xl h-full flex flex-col md:flex-row items-center gap-12"
        >
          {/* Map Container */}
          <div className="flex-1 w-full h-[70vh] relative group">
             <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
             <MapAntioquia 
                onMunicipalityClick={(id, name) => setSelectedTown({ id, name })}
                onMunicipalityHover={setHoveredTown}
                visitedTowns={visitedTowns}
              />
          </div>

          {/* Info Side Panel - filling the void */}
          <div className="hidden lg:flex flex-col w-80 gap-6">
            <div className="glass rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400">Current Location</h3>
              <div className="space-y-1">
                <p className="text-3xl font-black italic uppercase leading-tight">
                  {hoveredTown || 'Select a Town'}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Region: Antioquia, Colombia</p>
              </div>
            </div>

            <div className="glass rounded-3xl p-6">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white/50">Recent Activity</h3>
               </div>
               <div className="space-y-3">
                  {Object.keys(visitedTowns).length === 0 ? (
                    <p className="text-sm text-slate-600 italic">No visits recorded yet. Get out there!</p>
                  ) : (
                    Object.entries(visitedTowns).slice(-3).map(([id, data]) => (
                      <div key={id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5">
                          <img src={data.mainImageUrl} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider">
                          New town discovered!
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>
        </motion.div>
      </main>

      <AnimatePresence>
        {selectedTown && (
          <VisitModal
            townId={selectedTown.id}
            townName={selectedTown.name}
            onClose={() => setSelectedTown(null)}
            onUpdate={fetchVisitedTowns}
          />
        )}
        {(activeView === 'stats' || activeView === 'gallery') && (
          <StatsGalleryView
            type={activeView}
            onClose={() => setActiveView('map')}
            visitedTownIds={Object.keys(visitedTowns)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
