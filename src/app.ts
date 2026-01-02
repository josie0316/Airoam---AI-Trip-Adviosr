import express from 'express';
import aiRecommendRouter from './routes/ai-recommend';

// Express application setup
const app = express();

// Middleware for parsing JSON request bodies
app.use(express.json());

// Register AI recommendation routes
app.use('/api/ai-recommend', aiRecommendRouter);

// Additional routes and middleware can be added here

export default app; 