import { generateAiRecommendation } from './services/geminiService.js';
const result = await generateAiRecommendation('USR-1779682378224-8DCA21');
console.log('RESULT:', JSON.stringify(result, null, 2));
