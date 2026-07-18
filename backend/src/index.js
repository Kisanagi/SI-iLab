require('dotenv').config();
const express = require('express');
const cors = require('cors');

const chatRouter = require('./routes/chat');
const ticketsRouter = require('./routes/tickets');
const authRouter = require('./routes/auth');
const historyRouter = require('./routes/history');
const knowledgeBaseRouter = require('./routes/knowledge-base');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'https://si-ilab.vercel.app',
  'https://si-ilab.up.railway.app',
  'http://localhost:5173',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json({ limit: '20mb' }));

app.use('/chat', chatRouter);
app.use('/tickets', ticketsRouter);
app.use('/auth', authRouter);
app.use('/history', historyRouter);
app.use('/knowledge-base', knowledgeBaseRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend berjalan di http://localhost:${PORT}`);
});
