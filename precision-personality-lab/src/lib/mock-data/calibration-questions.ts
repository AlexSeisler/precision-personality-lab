import type { CalibrationQuestion } from '@/types';

export const quickCalibrationQuestions: CalibrationQuestion[] = [
  {
    id: 'q1',
    question: 'What type of responses do you prefer?',
    type: 'multiple-choice',
    options: [
      'Concise and direct',
      'Detailed and comprehensive',
      'Creative and exploratory',
      'Balanced and moderate',
    ],
    category: 'balance',
  },
  {
    id: 'q2',
    question: 'How important is factual accuracy versus creative interpretation?',
    type: 'multiple-choice',
    options: [
      'Accuracy is paramount',
      'Slight creativity acceptable',
      'Balance of both',
      'Creativity is key',
    ],
    category: 'creativity',
  },
  {
    id: 'q3',
    question: 'What level of response variety do you want?',
    type: 'multiple-choice',
    options: [
      'Consistent and predictable',
      'Mostly consistent with some variation',
      'Moderate variety',
      'Highly varied and unpredictable',
    ],
    category: 'creativity',
  },
  {
    id: 'q4',
    question: 'How structured should the responses be?',
    type: 'multiple-choice',
    options: [
      'Highly structured and organized',
      'Mostly structured',
      'Flexible structure',
      'Free-form and organic',
    ],
    category: 'precision',
  },
  {
    id: 'q5',
    question: 'What is your primary use case?',
    type: 'multiple-choice',
    options: [
      'Technical documentation',
      'Creative writing',
      'Data analysis',
      'General conversation',
    ],
    category: 'balance',
  },
];

export const deepCalibrationQuestions: CalibrationQuestion[] = [
  {
    id: 'd1',
    question: 'Describe your ideal AI response style in detail:',
    type: 'open-ended',
    category: 'balance',
  },
  {
    id: 'd2',
    question: 'What balance of creativity vs precision works best for your needs?',
    type: 'open-ended',
    category: 'balance',
  },
  {
    id: 'd3',
    question: 'How should the AI handle ambiguity in your prompts?',
    type: 'open-ended',
    category: 'precision',
  },
  {
    id: 'd4',
    question: 'What level of detail and explanation do you typically need?',
    type: 'open-ended',
    category: 'precision',
  },
];
