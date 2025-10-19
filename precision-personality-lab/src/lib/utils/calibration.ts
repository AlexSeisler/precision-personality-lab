import type { CalibrationAnswer, ParameterRange } from '@/types';

export function deriveParameterRanges(answers: CalibrationAnswer[]): ParameterRange {
  let creativityScore = 0;
  let precisionScore = 0;

  answers.forEach((answer) => {
    if (typeof answer.answer === 'string') {
      const answerLower = answer.answer.toLowerCase();

      if (answerLower.includes('creative') || answerLower.includes('varied') || answerLower.includes('exploratory')) {
        creativityScore++;
      }
      if (answerLower.includes('precise') || answerLower.includes('accurate') || answerLower.includes('structured')) {
        precisionScore++;
      }

      const wordCount = answerLower.split(/\s+/).length;
      if (wordCount > 20) {
        creativityScore += 0.5;
      }
    } else if (Array.isArray(answer.answer)) {
      creativityScore += answer.answer.length > 1 ? 0.5 : 0;
    }
  });

  const totalScore = creativityScore + precisionScore || 1;
  const creativityRatio = creativityScore / totalScore;
  const precisionRatio = precisionScore / totalScore;

  const temperatureMin = 0.3 + (creativityRatio * 0.4);
  const temperatureMax = 0.7 + (creativityRatio * 0.3);

  const topPMin = 0.6 + (creativityRatio * 0.2);
  const topPMax = 0.85 + (creativityRatio * 0.15);

  const maxTokensMin = 300 + (precisionRatio * 200);
  const maxTokensMax = 1000 + (creativityRatio * 1500);

  const frequencyMin = 0.0;
  const frequencyMax = 0.3 + (creativityRatio * 0.4);

  return {
    temperature: {
      min: Math.round(temperatureMin * 100) / 100,
      max: Math.round(temperatureMax * 100) / 100,
    },
    topP: {
      min: Math.round(topPMin * 100) / 100,
      max: Math.round(topPMax * 100) / 100,
    },
    maxTokens: {
      min: Math.round(maxTokensMin),
      max: Math.round(maxTokensMax),
    },
    frequencyPenalty: {
      min: Math.round(frequencyMin * 100) / 100,
      max: Math.round(frequencyMax * 100) / 100,
    },
  };
}

export function getCalibrationInsights(answers: CalibrationAnswer[]): string[] {
  const insights: string[] = [];

  const creativityKeywords = ['creative', 'varied', 'exploratory', 'free-form'];
  const precisionKeywords = ['precise', 'accurate', 'structured', 'consistent'];

  let creativityCount = 0;
  let precisionCount = 0;

  answers.forEach((answer) => {
    const answerStr = typeof answer.answer === 'string' ? answer.answer.toLowerCase() : '';

    creativityKeywords.forEach((keyword) => {
      if (answerStr.includes(keyword)) creativityCount++;
    });

    precisionKeywords.forEach((keyword) => {
      if (answerStr.includes(keyword)) precisionCount++;
    });
  });

  if (creativityCount > precisionCount) {
    insights.push('Your preferences lean toward creative and exploratory responses');
    insights.push('Higher temperature settings will suit your needs');
    insights.push('Expect more varied and imaginative outputs');
  } else if (precisionCount > creativityCount) {
    insights.push('Your preferences favor precision and consistency');
    insights.push('Lower temperature settings will provide better results');
    insights.push('Responses will be more focused and deterministic');
  } else {
    insights.push('You prefer a balanced approach');
    insights.push('Moderate parameter settings will work well');
    insights.push('Expect a mix of reliability and creativity');
  }

  return insights;
}
