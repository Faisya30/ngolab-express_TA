import { createApp } from './app.js';
import { getServerConfig, validateEnvironment } from './config/env.js';

validateEnvironment();
const { port, frontendOrigins, baseUrl } = getServerConfig();
const app = createApp({ frontendOrigins, baseUrl });

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend running on http://0.0.0.0:${port}`);
});