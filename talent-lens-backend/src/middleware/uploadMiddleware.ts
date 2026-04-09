import multer from 'multer';

const storage = multer.memoryStorage();
const maxUploadSizeMb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB) || 5;

const upload = multer({
  storage,
  limits: {
    fileSize: maxUploadSizeMb * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF files are allowed.'));
      return;
    }

    cb(null, true);
  },
});

export { upload };

