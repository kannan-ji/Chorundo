import { HeartHandshake, HelpCircle, UtensilsCrossed } from 'lucide-react';
import { motion } from 'motion/react';

export default function BrandingHeader() {
  return (
    <header className="w-full bg-emerald-50 border-b border-emerald-100 py-6 px-4 md:px-8 mb-6 rounded-3xl shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            {/* SVG Plantain Leaf Icon */}
            <motion.div
              initial={{ rotate: -5, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center p-1 shadow-lg shadow-emerald-200"
            >
              <svg viewBox="0 0 100 100" className="w-10 h-10 fill-emerald-100" xmlns="http://www.w3.org/2000/svg">
                {/* Clean minimalist stylized banana / plantain leaf with segments */}
                <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
                <path d="M50 10 L 50 90" stroke="#10b981" strokeWidth="3" />
                <path d="M50 25 L 68 32 M50 40 L 72 48 M50 55 L 70 63 M50 70 L 63 76" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                <path d="M50 25 L 32 32 M50 40 L 28 48 M50 55 L 30 63 M50 70 L 37 76" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </motion.div>

            <div>
              <h1 id="brand-title" className="text-3xl font-extrabold tracking-tight text-emerald-950 font-serif lowercase">
                chorundo?
              </h1>
              <p className="text-xs font-mono text-emerald-800 uppercase tracking-widest mt-0.5">
                nourishment by the community, for the community
              </p>
            </div>
          </div>

          <p className="text-sm mt-3 text-emerald-900 max-w-xl leading-relaxed">
            Derived from the endearing query <span className="font-semibold italic text-emerald-950">"chorundo?"</span> (Did you have rice?), we exist to make sure no neighbor goes hungry. Sponsoring a meal places a warm meal on a virtual plantain leaf at partner kitchens, ready to be respectfully claimed.
          </p>
        </div>

        {/* Informational Cards */}
        <div className="flex flex-wrap md:flex-nowrap gap-3 items-stretch w-full md:w-auto">
          <div className="flex-1 md:w-48 bg-white border border-emerald-100/60 p-3.5 rounded-2xl flex flex-col justify-between hover:shadow-md hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">1. Pre-pay</span>
              <HeartHandshake className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-600 leading-normal">
              Kind donors pay for basic, highly nutritious meals at registered local partner kitchens.
            </p>
          </div>

          <div className="flex-1 md:w-48 bg-white border border-emerald-100/60 p-3.5 rounded-2xl flex flex-col justify-between hover:shadow-md hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">2. Distribute</span>
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-600 leading-normal">
              Available meals are instantly listed. Athithis find the nearest spot using our navigation map.
            </p>
          </div>

          <div className="flex-1 md:w-48 bg-white border border-emerald-100/60 p-3.5 rounded-2xl flex flex-col justify-between hover:shadow-md hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">3. Honor Code</span>
              <HelpCircle className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-600 leading-normal">
              No device? No problem. Simply look for the chorundo? leaf banner and claim at the counter.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
