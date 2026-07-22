import { Reveal } from "../components/Reveal";
import { motion } from "framer-motion";
import { ShieldAlert, Heart, RefreshCw, Smile, Medal, Users, ChefHat, HelpCircle } from "lucide-react";

export function About() {
  return (
    <div className="w-full bg-transparent">
      {/* Hero Section */}
      <section className="relative h-[45vh] md:h-[55vh] flex items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 bg-emerald-950/40 z-10" />
        <img
          src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2500&auto=format&fit=crop"
          alt="Children smiling at school"
          className="absolute inset-0 w-full h-full object-cover z-0"
          referrerPolicy="no-referrer"
        />
        <div className="relative z-20 text-center max-w-3xl">
          <Reveal direction="down">
            <span className="bg-emerald-500/90 text-white text-[10px] font-sans font-black uppercase tracking-widest px-4.5 py-1.5 rounded-full inline-block mb-4 shadow">
              🛡️ OUR TRUST COVENANT
            </span>
          </Reveal>
          <Reveal delay={0.2}>
            <h1 className="font-display font-black text-4xl md:text-6xl text-white tracking-tight leading-none drop-shadow-md">
              Inside Gitanjali Canteen
            </h1>
          </Reveal>
        </div>
      </section>

      {/* Story Sections */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <Reveal direction="right" className="relative group">
            <div className="absolute inset-0 bg-emerald-100 rounded-3xl translate-x-4 translate-y-4 -z-10 transition-transform group-hover:translate-x-5 group-hover:translate-y-5" />
            <img 
              src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&q=80" 
              alt="Happy student lunch box" 
              className="rounded-3xl w-full h-[380px] object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
          </Reveal>
          
          <Reveal direction="left" className="space-y-5 text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400">THE FOUNDERS VISION</span>
            <h3 className="font-display font-black text-white text-3xl md:text-4xl leading-tight">
              A Noble Commitment to Nutrition
            </h3>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-semibold">
              Gitanjali School Canteen was established in response to a growing national health concern: the decline of balanced nutrition in student lunch boxes. We realized packing nutritional lunches at 5:00 AM placed immense stress on working parents.
            </p>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-semibold">
              In 2021, our board of school trustees partnered with certified pediatric dietitians and organic agro-networks to revolutionize our school kitchen, ensuring every student has access to fresh, hot, pesticide-free meals.
            </p>
          </Reveal>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center flex-col-reverse lg:flex-row-reverse mb-10">
          <Reveal direction="left" className="relative group lg:order-2">
            <div className="absolute inset-0 bg-sky-100 rounded-3xl -translate-x-4 translate-y-4 -z-10 transition-transform group-hover:-translate-x-5 group-hover:translate-y-5" />
            <img 
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80" 
              alt="Organic Kitchen Sourcing" 
              className="rounded-3xl w-full h-[380px] object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
          </Reveal>
          
          <Reveal direction="right" className="space-y-5 lg:order-1 text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400">HYGIENE MANDATE</span>
            <h3 className="font-display font-black text-white text-3xl md:text-4xl leading-tight">
              An FSSAI Gold-Grade Kitchen
            </h3>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-semibold">
              Our kitchen conforms to state-of-the-art cleanliness policies. Staff pass daily health examinations, compile allergen control indexes seamlessly, and handle organic produce under sterile water cascades.
            </p>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-semibold">
              By utilizing multi-tier insulated stainless steel thermals, we bypass chemical containers, guaranteeing zero plastic contamination as meals travel securely from our kitchen to classroom benches.
            </p>
          </Reveal>
        </div>

      </section>

      {/* Core Values Section */}
      <section className="py-20 bg-white/5/50 border-t border-white/10/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          <Reveal className="text-center mb-16">
            <span className="bg-emerald-50 text-brand-emerald text-[10px] font-sans font-black uppercase tracking-widest px-3.5 py-1 rounded-full border border-emerald-100 inline-block mb-3">
              🛡️ INDEPENDENT GUARANTEES
            </span>
            <h3 className="font-display font-black text-white text-3xl md:text-4xl tracking-tight leading-none">
              The Gitanjali Canteen Pledge
            </h3>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Medal, title: "FSSAI Grade-A", text: "Regular independent kitchen audits for pure ingredient standards." },
              { icon: Heart, title: "Pediatric Certified", text: "Healthy fats, calcium, complex fibers, and low sodium formulas." },
              { icon: ChefHat, title: "Dietitian Signature", text: "Menurotation drafts signed by professional child counselors." },
              { icon: Users, title: "Parent CCTV Access", text: "Watch raw ingredient handling and cooking live from our mobile app." }
            ].map((val, i) => (
              <Reveal key={i} delay={i * 0.1} direction="up" className="bg-slate-900 border-white/10 text-white p-6 rounded-2xl border border-slate-150/80 text-center shadow-sm">
                <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 text-brand-emerald flex items-center justify-center mb-5 border border-emerald-100 shadow-sm">
                  <val.icon className="w-5.5 h-5.5" />
                </div>
                <h4 className="font-display font-black text-slate-850 text-sm mb-2">{val.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed font-semibold">{val.text}</p>
              </Reveal>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}
