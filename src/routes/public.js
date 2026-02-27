// routes/public.js
import express from 'express';
import { getActiveWelcomeMessage } from '../services/welcomeMessage.service.js';

const router = express.Router();

router.get('/welcome-message', (_, res) => {
  const message = getActiveWelcomeMessage();

  if (!message) {
    return res.json({ active: false });
  }

  res.json({
    active: true,
    message: message.message,
    subMessage: message.subMessage,
    durationMs: message.durationMs
  });
});

export default router;
