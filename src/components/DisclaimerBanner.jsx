import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <div className="w-full bg-slate-950 border-t border-slate-800 p-4 flex justify-center items-center mt-auto">
      <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
        <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
        <p>
          This tool is for informational purposes only. Always consult your healthcare provider before starting any new supplement.
        </p>
      </div>
    </div>
  );
}