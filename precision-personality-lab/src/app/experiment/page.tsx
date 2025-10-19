import { Flask } from "lucide-react";

export default function ExperimentPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
            <Flask className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Experiment Studio
            </h1>
            <p className="text-gray-400 mt-1">
              Run controlled experiments with different parameter sets
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-8">
          <p className="text-gray-300 text-center">
            Experiment interface coming in Step 4
          </p>
        </div>
      </div>
    </div>
  );
}
