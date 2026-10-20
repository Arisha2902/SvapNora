'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const ApiError = require('../utils/ApiError');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const ext = ALLOWED_TYPES[file.mimetype] || path.extname(file.originalname).toLowerCase();
    const safe = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_TYPES[file.mimetype]) {
      return cb(
        ApiError.badRequest('Only JPG, PNG, WEBP, GIF or SVG images are allowed', {
          code: 'INVALID_FILE_TYPE',
        }),
      );
    }
    return cb(null, true);
  },
});

/** Converts multer errors into the shared JSON error shape. */
function handleUpload(req, _res, next) {
  const single = upload.single('image');
  single(req, _res, (err) => (err ? next(err) : next()));
}

module.exports = { upload, handleUpload, UPLOAD_DIR, ALLOWED_TYPES };
