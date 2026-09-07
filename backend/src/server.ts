import { app } from './app';
import { config } from './config';
import { connectDatabase } from './config/database';

connectDatabase()
  .then(() => app.listen(config.port, () => console.log(`API listening on port ${config.port}`)))
  .catch((error) => {
    console.error('Unable to start server', error);
    process.exit(1);
  });
