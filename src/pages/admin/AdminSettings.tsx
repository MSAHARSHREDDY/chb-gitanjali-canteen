import React from 'react';
import { Sliders } from 'lucide-react';

export function AdminSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#0d1530] to-[#080d22] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <span className="text-gray-400 text-xs font-mono tracking-widest uppercase mb-1 block">System Configuration</span>
          <h3 className="text-3xl font-bold font-serif text-white">Settings</h3>
          <p className="text-slate-400 text-sm mt-1">Configure global application settings and parameters.</p>
        </div>
      </div>
      <div className="bg-[#0b1229] border border-white/5 rounded-2xl p-6 shadow-2xl">
        <p className="text-gray-400 font-mono text-sm">Settings panel is currently under maintenance. Please check back later.</p>
      </div>
    </div>
  );
}
