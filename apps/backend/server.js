import { createApp } from './app.js';
import { getServerConfig, validateEnvironment } from './config/env.js';

validateEnvironment();
const { port, frontendOrigins } = getServerConfig();
const app = createApp({ frontendOrigins });

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});