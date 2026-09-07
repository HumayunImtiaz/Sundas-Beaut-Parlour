import multer from 'multer';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = Object.assign(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed'), { statusCode: 400 });
      return callback(error);
    }
    callback(null, true);
  }
});

export const uploadImage = imageUpload.single('image');