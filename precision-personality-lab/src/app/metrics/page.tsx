import { BarChart3 } from "lucide-react";

export default function MetricsPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Visualize response patterns and parameter correlations
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-8">
          <p className="text-gray-300 text-center">
            Analytics dashboard coming in Step 5
          </p>
        </div>
      </div>
    </div>
  );
}
