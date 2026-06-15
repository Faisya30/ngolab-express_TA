import { getAiRecommendation } from './controllers/recommendationController.js';

const req = { params: { userId: 'USR-1779682378224-8DCA21' } };
const res = {
  status(code) {
    console.log('STATUS:', code);
    return this;
  },
  json(data) {
    console.log('RESPONSE:', JSON.stringify(data, null, 2));
  }
};

await getAiRecommendation(req, res);
