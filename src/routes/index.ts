import { Hono } from 'hono';
import webhookRouter from './webhook.routes';
import tokenRouter from './token.routes';
import loginRouter from '../routes/login.routes';


// Create a Hono router for API routes
const apiRouter = new Hono();

// Register API routes
apiRouter.route('/webhook', webhookRouter);
apiRouter.route('/tokens', tokenRouter);
apiRouter.route('/login', loginRouter);

export default apiRouter; 