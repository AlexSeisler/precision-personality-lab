import { Home as HomeIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <HomeIcon className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white glow-cyan">
              Welcome to Precision + Personality Lab
            </h1>
            <p className="text-gray-400 mt-1">
              Explore LLM parameter behavior through interactive experimentation
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-8">
          <p className="text-gray-300 text-center">
            Landing page content coming in Step 3
          </p>
        </div>
      </div>
    </div>
  );
}
