import multer from 'multer';
import { env } from '../config/env.js';

const storage = multer.diskStorage({
  destination: env.UPLOAD_DIRECTORY,
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    callback(null, `${Date.now()}-${safeName}`);
  },
});

export const upload = multer({ storage });
