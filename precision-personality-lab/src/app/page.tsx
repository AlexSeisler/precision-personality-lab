'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Sliders, FlaskConical, BarChart3, ArrowRight, Zap, Target, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthForm } from '@/components/auth/auth-form';
import { useAuth } from '@/lib/auth/auth-context';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#4A8FFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }
  return (
    <div className="w-full">
      <section className="relative py-20 lg:py-32">
        <div className="px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl gradient-precision"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text-precision">Step Into the Lab</span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
              Master your model's mind — control the precision, calibrate the creativity
            </p>

            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              An interactive console where you can visualize how AI thinks when you turn the dials.
              Explore LLM parameters through hands-on experimentation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/calibration">
                <Button size="lg" className="group">
                  Start Calibration
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link href="/experiment">
                <Button size="lg" variant="secondary">
                  Jump to Experiment
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid md:grid-cols-3 gap-6 mb-16"
          >
            <FeatureCard
              icon={<Sliders className="w-6 h-6" />}
              title="Calibrate"
              description="Define your AI's personality through an adaptive quiz system"
              color="blue"
              delay={0.4}
            />

            <FeatureCard
              icon={<FlaskConical className="w-6 h-6" />}
              title="Experiment"
              description="Adjust temperature, top_p, and other parameters in real-time"
              color="orange"
              delay={0.5}
            />

            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Analyze"
              description="Visualize response metrics and parameter correlations"
              color="purple"
              delay={0.6}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="glass-panel rounded-2xl p-8 lg:p-12"
          >
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              Why Precision + Personality?
            </h2>

            <div className="grid lg:grid-cols-3 gap-8">
              <ValueProp
                icon={<Target className="w-8 h-8 text-[#4A8FFF]" />}
                title="Scientific Control"
                description="Measure, quantify, and understand how each parameter affects AI behavior"
              />

              <ValueProp
                icon={<Brain className="w-8 h-8 text-[#FF7E47]" />}
                title="Creative Calibration"
                description="Shape your model's personality through intelligent parameter mapping"
              />

              <ValueProp
                icon={<Zap className="w-8 h-8 text-purple-400" />}
                title="Instant Feedback"
                description="See real-time metrics, comparisons, and visual insights as you experiment"
              />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'orange' | 'purple';
  delay: number;
}

function FeatureCard({ icon, title, description, color, delay }: FeatureCardProps) {
  const colorClasses = {
    blue: 'from-[#4A8FFF]/20 to-[#3A7FEF]/10 border-[#4A8FFF]/30',
    orange: 'from-[#FF7E47]/20 to-[#EF6E37]/10 border-[#FF7E47]/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  };

  const iconColorClasses = {
    blue: 'text-[#4A8FFF]',
    orange: 'text-[#FF7E47]',
    purple: 'text-purple-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card
        hoverable
        className={`p-6 bg-gradient-to-br ${colorClasses[color]} h-full`}
      >
        <div className={`inline-flex p-3 rounded-lg bg-black/20 mb-4 ${iconColorClasses[color]}`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-300">{description}</p>
      </Card>
    </motion.div>
  );
}

interface ValuePropProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ValueProp({ icon, title, description }: ValuePropProps) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-white/5 border border-white/10">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
