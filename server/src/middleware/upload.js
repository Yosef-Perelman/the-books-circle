import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new ApiError(400, 'BAD_REQUEST', 'Only image files are allowed.'));
    }
    cb(null, true);
  }
});
