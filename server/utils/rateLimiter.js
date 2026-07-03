import rateLimit from 'express-rate-limit'

export const downloadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many download requests. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many upload requests. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const pingLimiter = rateLimit({
  windowMs: 1000,
  max: 60,
  message: { error: 'Too many ping requests.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const complaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many complaints. Max 5 per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many requests.' },
  standardHeaders: true,
  legacyHeaders: false,
})
