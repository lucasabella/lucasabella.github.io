import cors from 'cors';
import config from '../config/env.js';

export default cors({
  origin: config.corsOrigin,
  credentials: true,
});
