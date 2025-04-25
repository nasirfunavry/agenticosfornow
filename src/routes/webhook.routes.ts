import { Hono } from 'hono';
import { registerWebhook, tweetWebhook } from '../controllers/webhook.controller';

// Create a Hono router for webhook routes
const webhookRouter = new Hono();

// Register webhook routes
webhookRouter.post('/register', registerWebhook);
webhookRouter.post('/', tweetWebhook);

export default webhookRouter; 