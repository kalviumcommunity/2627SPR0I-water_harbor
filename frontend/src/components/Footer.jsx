import { Droplets, RotateCcw, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/useApp';

export default function Footer() {
  const { resetToSeed } = useApp();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">
                Campus WaterPoint Board
              </div>
              <p className="text-xs text-slate-500">
                Centralized dispenser reporting & facilities resolution tracking
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span><strong>Campus:</strong> CHR</span>
            <span>•</span>
            <span><strong>Squad:</strong> 62</span>
            <span>•</span>
            <span><strong>Team:</strong> 03</span>
            <span>•</span>
            <button
              type="button"
              onClick={resetToSeed}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-sky-600 transition-colors cursor-pointer"
              title="Reset state to initial demonstration dataset"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>

        {/* PRD Compliance Disclaimer */}
        <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
          <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <strong>PRD Status Disclaimer:</strong> This board aggregates community reports submitted by students carrying bottles across campus and updates confirmed by facilities staff. It does not employ IoT sensors or provide real-time automated verification. Dispensers without recent reports are labeled <em>No Recent Report / Unknown</em>.
          </p>
        </div>
      </div>
    </footer>
  );
}
