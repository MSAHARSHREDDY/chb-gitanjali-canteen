import { MapPin, Phone, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/10 py-6 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-slate-400 text-xs sm:text-sm">
          <div className="space-y-1 max-w-xl">
            <p className="flex items-start justify-center md:justify-start gap-1.5">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span><strong>Address:</strong> CH, Bakers, Plot no 27, beside Indian Oil Petrol Pump Bachupally-Mallampet Road, pin code 500090</span>
            </p>
            <p className="flex items-center justify-center md:justify-start gap-1.5 text-amber-400">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
              <span><strong>FASSI No:</strong> 23626029002401</span>
            </p>
          </div>
          <div className="shrink-0 flex items-center justify-center gap-1.5 text-white font-semibold">
            <Phone className="w-4 h-4 text-amber-500" />
            <span><strong>Contact Number:</strong> 7989922340 / 6281435826</span>
          </div>
        </div>
        <div className="border-t border-white/5 mt-4 pt-4 text-center text-[10px] text-slate-400 font-mono">
          &copy; {new Date().getFullYear()} Gitanjali School Canteen. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
