'use client';

import { motion } from 'framer-motion';
import { BarChart3, Download, TrendingUp } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useExperimentStore } from '@/store/experiment-store';
import { useUIStore } from '@/store/ui-store';
import { exportExperiment } from '@/lib/utils/export';

export default function MetricsPage() {
  const { currentResponses } = useExperimentStore();
  const { addToast } = useUIStore();

  if (currentResponses.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30">
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

          <Card className="p-12 text-center">
            <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No data to analyze yet
            </h3>
            <p className="text-gray-500 mb-6">
              Generate responses in the Experiment Studio to see analytics
            </p>
            <Button onClick={() => (window.location.href = '/experiment')}>
              Go to Experiment Studio
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const radarData = currentResponses.map((response, index) => ({
    subject: `R${index + 1}`,
    Creativity: response.metrics.creativity,
    Coherence: response.metrics.coherence,
    Structure: response.metrics.structure,
    Completeness: response.metrics.completeness,
    Diversity: response.metrics.lexicalDiversity,
  }));

  const barData = currentResponses.map((response, index) => ({
    name: `Response ${index + 1}`,
    Temperature: response.parameters.temperature * 50,
    'Top P': response.parameters.topP * 100,
    Creativity: response.metrics.creativity,
    Coherence: response.metrics.coherence,
  }));

  const avgMetrics = {
    creativity:
      currentResponses.reduce((acc, r) => acc + r.metrics.creativity, 0) /
      currentResponses.length,
    coherence:
      currentResponses.reduce((acc, r) => acc + r.metrics.coherence, 0) /
      currentResponses.length,
    structure:
      currentResponses.reduce((acc, r) => acc + r.metrics.structure, 0) /
      currentResponses.length,
    completeness:
      currentResponses.reduce((acc, r) => acc + r.metrics.completeness, 0) /
      currentResponses.length,
  };

  const handleExport = (format: 'csv' | 'json') => {
    exportExperiment(currentResponses, format);
    addToast(
      `Exported ${currentResponses.length} responses as ${format.toUpperCase()}`,
      'success'
    );
  };

  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Analytics Dashboard
              </h1>
              <p className="text-gray-400 mt-1">
                {currentResponses.length} responses analyzed
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => handleExport('json')}>
              <Download className="w-4 h-4" />
              Export JSON
            </Button>
            <Button variant="secondary" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Avg Creativity"
            value={avgMetrics.creativity}
            color="orange"
          />
          <MetricCard
            label="Avg Coherence"
            value={avgMetrics.coherence}
            color="blue"
          />
          <MetricCard
            label="Avg Structure"
            value={avgMetrics.structure}
            color="purple"
          />
          <MetricCard
            label="Avg Completeness"
            value={avgMetrics.completeness}
            color="blue"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">
              Metrics Comparison
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData[0] ? [radarData[0]] : radarData}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                />
                <Radar
                  name="Creativity"
                  dataKey="Creativity"
                  stroke="#FF7E47"
                  fill="#FF7E47"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Coherence"
                  dataKey="Coherence"
                  stroke="#4A8FFF"
                  fill="#4A8FFF"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Structure"
                  dataKey="Structure"
                  stroke="#A855F7"
                  fill="#A855F7"
                  fillOpacity={0.3}
                />
                <Legend wrapperStyle={{ color: '#fff' }} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">
              Parameter Impact
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255, 255, 255, 0.1)"
                />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 18, 22, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="Creativity" fill="#FF7E47" />
                <Bar dataKey="Coherence" fill="#4A8FFF" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Response Details
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-sm font-semibold text-gray-300">
                    Response
                  </th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-300">
                    Temperature
                  </th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-300">
                    Top P
                  </th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-300">
                    Creativity
                  </th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-300">
                    Coherence
                  </th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-300">
                    Length
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentResponses.map((response, index) => (
                  <motion.tr
                    key={response.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-3 text-sm text-white">
                      Response {index + 1}
                    </td>
                    <td className="p-3 text-sm text-gray-300">
                      {response.parameters.temperature.toFixed(2)}
                    </td>
                    <td className="p-3 text-sm text-gray-300">
                      {response.parameters.topP.toFixed(2)}
                    </td>
                    <td className="p-3 text-sm text-[#FF7E47] font-semibold">
                      {response.metrics.creativity.toFixed(0)}
                    </td>
                    <td className="p-3 text-sm text-[#4A8FFF] font-semibold">
                      {response.metrics.coherence.toFixed(0)}
                    </td>
                    <td className="p-3 text-sm text-gray-300">
                      {response.metrics.length} words
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  color: 'blue' | 'orange' | 'purple';
}

function MetricCard({ label, value, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'from-[#4A8FFF]/20 to-[#3A7FEF]/10 border-[#4A8FFF]/30',
    orange: 'from-[#FF7E47]/20 to-[#EF6E37]/10 border-[#FF7E47]/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  };

  return (
    <Card className={`p-4 bg-gradient-to-br ${colorClasses[color]}`}>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value.toFixed(1)}</p>
    </Card>
  );
}
