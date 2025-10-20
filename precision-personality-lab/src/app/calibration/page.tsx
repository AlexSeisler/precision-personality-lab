'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sliders, ChevronLeft, ChevronRight, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCalibrationStore } from '@/store/calibration-store';
import { useUIStore } from '@/store/ui-store';
import { quickCalibrationQuestions, deepCalibrationQuestions } from '@/lib/mock-data/calibration-questions';
import { deriveParameterRanges, getCalibrationInsights } from '@/lib/utils/calibration';
import { supabase } from '@/lib/supabase/client';
import { logAuditEvent } from '@/lib/api/audit';
import type { CalibrationAnswer } from '@/types';

export default function CalibrationPage() {
  const router = useRouter();
  const {
    answers,
    isCalibrated,
    calibrationMode,
    currentQuestionIndex,
    parameterRanges,
    setAnswer,
    setParameterRanges,
    setCalibrated,
    setCalibrationMode,
    setCurrentQuestionIndex,
    setCalibrationId,
    resetCalibration,
  } = useCalibrationStore();

  const { addToast } = useUIStore();

  const [localAnswer, setLocalAnswer] = useState<string>('');

  const questions = calibrationMode === 'quick' ? quickCalibrationQuestions : deepCalibrationQuestions;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    const existingAnswer = answers.find((a) => a.questionId === currentQuestion?.id);
    if (existingAnswer) {
      setLocalAnswer(typeof existingAnswer.answer === 'string' ? existingAnswer.answer : '');
    } else {
      setLocalAnswer('');
    }
  }, [currentQuestionIndex, currentQuestion, answers]);

  const handleNext = () => {
    if (!localAnswer.trim()) {
      addToast('Please provide an answer before continuing', 'warning');
      return;
    }

    const answer: CalibrationAnswer = {
      questionId: currentQuestion.id,
      answer: localAnswer,
      type: currentQuestion.type,
    };

    setAnswer(answer);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      completeCalibration();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const completeCalibration = async () => {
    const allAnswers = [...answers, {
      questionId: currentQuestion.id,
      answer: localAnswer,
      type: currentQuestion.type,
    }];

    const ranges = deriveParameterRanges(allAnswers);
    setParameterRanges(ranges);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: calibration, error } = await supabase
          .from('calibrations')
          .insert({
            user_id: user.id,
            answers: allAnswers,
            temperature_min: ranges.temperature.min,
            temperature_max: ranges.temperature.max,
            top_p_min: ranges.topP.min,
            top_p_max: ranges.topP.max,
            max_tokens_min: ranges.maxTokens.min,
            max_tokens_max: ranges.maxTokens.max,
            frequency_penalty_min: ranges.frequencyPenalty.min,
            frequency_penalty_max: ranges.frequencyPenalty.max,
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to save calibration:', error);
          addToast('Calibration completed but failed to save', 'warning');
        } else if (calibration) {
          setCalibrationId(calibration.id);
          await logAuditEvent('calibration_completed', {
            calibration_id: calibration.id,
            mode: calibrationMode,
          });
          addToast('Calibration complete! Your parameter ranges have been saved.', 'success');
        }
      }
    } catch (error) {
      console.error('Calibration save error:', error);
      addToast('Calibration completed but failed to save', 'warning');
    }

    setCalibrated(true);
  };

  const handleRecalibrate = () => {
    resetCalibration();
    setCurrentQuestionIndex(0);
    setLocalAnswer('');
  };

  const handleProceedToExperiment = () => {
    router.push('/experiment');
  };

  if (!currentQuestion && !isCalibrated) {
    return (
      <div className="py-8">
        <div className="px-6 md:px-8 text-center">
          <p className="text-gray-400">Loading calibration...</p>
        </div>
      </div>
    );
  }

  if (isCalibrated && parameterRanges) {
    return <CalibrationResultsView
      ranges={parameterRanges}
      insights={getCalibrationInsights(answers)}
      onRecalibrate={handleRecalibrate}
      onProceed={handleProceedToExperiment}
    />;
  }

  return (
    <div className="w-full">
      <div className="px-6 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#4A8FFF]/20 to-[#3A7FEF]/10 border border-[#4A8FFF]/30">
              <Sliders className="w-6 h-6 text-[#4A8FFF]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white glow-blue">
                Calibration Console
              </h1>
              <p className="text-gray-400 mt-1">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCalibrationMode(calibrationMode === 'quick' ? 'deep' : 'quick')}
            >
              Switch to {calibrationMode === 'quick' ? 'Deep' : 'Quick'} Mode
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-precision"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 mb-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                {currentQuestion.question}
              </h2>

              {currentQuestion.type === 'multiple-choice' && currentQuestion.options ? (
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <motion.button
                      key={option}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setLocalAnswer(option)}
                      className={`
                        w-full p-4 rounded-lg text-left transition-all
                        ${localAnswer === option
                          ? 'bg-[#4A8FFF]/20 border-2 border-[#4A8FFF] text-white'
                          : 'bg-white/5 border-2 border-white/10 text-gray-300 hover:bg-white/10'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center
                          ${localAnswer === option ? 'border-[#4A8FFF] bg-[#4A8FFF]' : 'border-gray-500'}
                        `}>
                          {localAnswer === option && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full bg-white"
                            />
                          )}
                        </div>
                        <span>{option}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={localAnswer}
                  onChange={(e) => setLocalAnswer(e.target.value)}
                  placeholder="Type your detailed response here..."
                  className="w-full h-40 p-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#4A8FFF] focus:ring-2 focus:ring-[#4A8FFF]/20 resize-none"
                />
              )}
            </Card>

            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </Button>

              <Button onClick={handleNext}>
                {currentQuestionIndex === questions.length - 1 ? 'Complete Calibration' : 'Next'}
                {currentQuestionIndex !== questions.length - 1 && (
                  <ChevronRight className="w-5 h-5" />
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

interface CalibrationResultsViewProps {
  ranges: {
    temperature: { min: number; max: number };
    topP: { min: number; max: number };
    maxTokens: { min: number; max: number };
    frequencyPenalty: { min: number; max: number };
  };
  insights: string[];
  onRecalibrate: () => void;
  onProceed: () => void;
}

function CalibrationResultsView({ ranges, insights, onRecalibrate, onProceed }: CalibrationResultsViewProps) {
  return (
    <div className="w-full">
      <div className="px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-green-500/20 border-2 border-green-500"
            >
              <CheckCircle className="w-10 h-10 text-green-400" />
            </motion.div>

            <h1 className="text-4xl font-bold text-white mb-4">
              Calibration Complete!
            </h1>
            <p className="text-xl text-gray-300">
              Your personalized parameter ranges have been calculated
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <ParameterRangeCard
              label="Temperature"
              min={ranges.temperature.min}
              max={ranges.temperature.max}
              description="Controls response randomness and creativity"
              color="blue"
            />

            <ParameterRangeCard
              label="Top P"
              min={ranges.topP.min}
              max={ranges.topP.max}
              description="Nucleus sampling threshold"
              color="orange"
            />

            <ParameterRangeCard
              label="Max Tokens"
              min={ranges.maxTokens.min}
              max={ranges.maxTokens.max}
              description="Maximum response length"
              color="purple"
            />

            <ParameterRangeCard
              label="Frequency Penalty"
              min={ranges.frequencyPenalty.min}
              max={ranges.frequencyPenalty.max}
              description="Reduces word repetition"
              color="blue"
            />
          </div>

          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Your Insights</h2>
            <ul className="space-y-3">
              {insights.map((insight, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-start gap-3 text-gray-300"
                >
                  <div className="w-2 h-2 rounded-full bg-[#4A8FFF] mt-2 flex-shrink-0" />
                  <span>{insight}</span>
                </motion.li>
              ))}
            </ul>
          </Card>

          <div className="flex gap-4 justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={onProceed}
                size="lg"
                className="bg-gradient-to-r from-[#4A8FFF] to-[#FF7E47] text-white hover:brightness-110 transition-all shadow-[0_0_30px_rgba(74,143,255,0.3)]"
              >
                Proceed to Experiment →
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button variant="secondary" onClick={onRecalibrate} size="lg">
                <RefreshCw className="w-5 h-5" />
                Recalibrate
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface ParameterRangeCardProps {
  label: string;
  min: number;
  max: number;
  description: string;
  color: 'blue' | 'orange' | 'purple';
}

function ParameterRangeCard({ label, min, max, description, color }: ParameterRangeCardProps) {
  const colorClasses = {
    blue: 'from-[#4A8FFF]/20 to-[#3A7FEF]/10 border-[#4A8FFF]/30',
    orange: 'from-[#FF7E47]/20 to-[#EF6E37]/10 border-[#FF7E47]/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  };

  return (
    <Card className={`p-6 bg-gradient-to-br ${colorClasses[color]}`}>
      <h3 className="text-lg font-bold text-white mb-2">{label}</h3>
      <p className="text-sm text-gray-400 mb-4">{description}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{min.toFixed(2)}</span>
        <span className="text-gray-400">to</span>
        <span className="text-3xl font-bold text-white">{max.toFixed(2)}</span>
      </div>
    </Card>
  );
}
