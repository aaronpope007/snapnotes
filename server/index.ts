import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import playersRouter from './routes/players.js';
import handsToReviewRouter from './routes/handsToReview.js';
import reviewersRouter from './routes/reviewers.js';
import backupRouter from './routes/backup.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/players', playersRouter);
app.use('/api/hands-to-review', handsToReviewRouter);
app.use('/api/reviewers', reviewersRouter);
app.use('/api/backup', backupRouter);

const start = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Add it to server/.env');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

start();
