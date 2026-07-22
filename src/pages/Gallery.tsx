import { useQuery } from "@tanstack/react-query";
import { getGalleryItems } from "../api/client";
import { Reveal } from "../components/Reveal";
import { useState } from "react";
import { cn } from "../utils/cn";
import { X, ZoomIn } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function Gallery() {
  const { data: items, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: getGalleryItems,
  });

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="pt-8 md:pt-12 min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-8 md:pt-12 pb-32 min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Reveal className="text-center mb-16">
          <h2 className="text-gold-500 text-sm tracking-[0.2em] uppercase mb-4">Visual Journey</h2>
          <h1 className="heading-serif text-5xl md:text-6xl text-white">The Canteen Gallery</h1>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px]">
          {items?.map((item: any, i: number) => (
             <Reveal 
               key={item.id} 
               delay={i * 0.1}
               className={cn(
                 "relative group rounded-2xl overflow-hidden cursor-pointer",
                 i === 0 || i === 3 ? "md:col-span-2" : "col-span-1"
               )}
             >
               <img 
                 src={item.src} 
                 alt={item.title} 
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
               />
               <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                 <ZoomIn className="w-10 h-10 text-white" />
               </div>
               <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-slate-950 to-transparent">
                 <h3 className="heading-serif text-xl text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                   {item.title}
                 </h3>
                 <p className="text-gold-500 text-sm tracking-widest uppercase mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                   {item.category}
                 </p>
               </div>
               
               {/* Click overlay */}
               <div className="absolute inset-0 z-10" onClick={() => setLightboxIndex(i)} />
             </Reveal>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <button 
              onClick={() => setLightboxIndex(null)}
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={items?.[lightboxIndex]?.src}
              alt=""
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            
            <div className="absolute bottom-8 text-center">
               <h3 className="heading-serif text-2xl text-white mb-2">{items?.[lightboxIndex]?.title}</h3>
               <p className="text-gold-500 uppercase tracking-widest text-sm">{items?.[lightboxIndex]?.category}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

