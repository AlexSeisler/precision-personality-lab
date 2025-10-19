import type { ExperimentParameters, LLMResponse, ResponseMetrics } from '@/types';

const sampleResponses = [
  'Artificial intelligence represents a transformative technology that enables machines to perform tasks requiring human-like cognitive functions. Through machine learning algorithms and neural networks, AI systems can analyze vast datasets, recognize patterns, and make informed decisions. The field encompasses various subdomains including natural language processing, computer vision, and robotics, each contributing to the advancement of intelligent systems.',

  'The emergence of AI has sparked fascinating debates about consciousness, creativity, and the nature of intelligence itself. As these systems grow more sophisticated, they challenge our understanding of what it means to think, learn, and create. The interplay between human intuition and machine precision opens new frontiers in problem-solving and innovation.',

  'In practical applications, AI serves as a powerful tool for augmenting human capabilities across industries. From healthcare diagnostics to financial forecasting, these systems process information at scales impossible for humans alone. The key lies in understanding AI not as a replacement for human judgment, but as a complementary force that enhances our analytical and creative capacities.',

  'The architecture of modern AI systems relies on layers of interconnected nodes that mirror, albeit simplistically, the neural structures of biological brains. These networks process inputs through weighted connections, adjusting their parameters through training to optimize performance on specific tasks. The elegance lies in their ability to discover patterns without explicit programming.',

  'As we integrate AI into society, questions of ethics, transparency, and accountability become paramount. The decisions made by these systems can have profound impacts on individuals and communities. Developing frameworks for responsible AI deployment requires collaboration between technologists, policymakers, and ethicists to ensure these tools serve the common good.',
];

function calculateMetrics(text: string, params: ExperimentParameters): ResponseMetrics {
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length;
  const uniqueWords = new Set(text.toLowerCase().split(/\s+/)).size;

  return {
    length: words,
    completeness: Math.min(100, (words / 200) * 100 + (params.maxTokens / 2000) * 20),
    coherence: 75 + (1 - params.temperature) * 20 + Math.random() * 10,
    structure: 70 + params.topP * 25 + Math.random() * 10,
    lexicalDiversity: (uniqueWords / words) * 100,
    creativity: 40 + params.temperature * 50 + Math.random() * 15,
  };
}

export function generateMockResponse(
  prompt: string,
  parameters: ExperimentParameters
): LLMResponse {
  const variationIndex = Math.floor(Math.random() * sampleResponses.length);
  const baseResponse = sampleResponses[variationIndex];

  const temperatureAdjustment = parameters.temperature > 0.7 ?
    ' Exploring creative angles and unexpected connections, this perspective offers fresh insights.' :
    ' This analysis follows established patterns with precision and clarity.';

  const topPAdjustment = parameters.topP < 0.8 ?
    ' The focus narrows to core concepts with high confidence.' :
    ' A broader range of possibilities is considered in this exploration.';

  let responseText = baseResponse;

  if (parameters.temperature > 0.8) {
    responseText += temperatureAdjustment;
  }
  if (parameters.topP > 0.9 || parameters.topP < 0.8) {
    responseText += topPAdjustment;
  }

  const metrics = calculateMetrics(responseText, parameters);

  return {
    id: `response-${Date.now()}-${Math.random()}`,
    text: responseText,
    parameters,
    metrics,
    timestamp: Date.now(),
    prompt,
  };
}

export function generateMultipleResponses(
  prompt: string,
  parameters: ExperimentParameters,
  count: number = 3
): LLMResponse[] {
  const responses: LLMResponse[] = [];

  for (let i = 0; i < count; i++) {
    const variedParams = {
      ...parameters,
      temperature: parameters.temperature + (Math.random() - 0.5) * 0.2,
      topP: Math.min(1, Math.max(0.1, parameters.topP + (Math.random() - 0.5) * 0.1)),
    };

    responses.push(generateMockResponse(prompt, variedParams));
  }

  return responses;
}

export async function simulateStreamingResponse(
  text: string,
  onChunk: (chunk: string) => void,
  delay: number = 25
): Promise<void> {
  const words = text.split(' ');

  for (let i = 0; i < words.length; i++) {
    const word = words[i] + ' ';
    onChunk(word);
    await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 20));
  }
}
