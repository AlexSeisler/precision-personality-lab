import { Sliders } from "lucide-react";

export default function CalibrationPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <Sliders className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Calibration Console
            </h1>
            <p className="text-gray-400 mt-1">
              Configure LLM parameters and test response characteristics
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-8">
          <p className="text-gray-300 text-center">
            Calibration interface coming in Step 3
          </p>
        </div>
      </div>
    </div>
  );
}
