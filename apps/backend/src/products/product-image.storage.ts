import { randomUUID } from 'crypto';
import { extname } from 'path';
import { diskStorage } from 'multer';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

const UPLOAD_DEST = process.env.UPLOAD_DEST ?? './uploads';

/**
 * Disk storage for product images. Files land in UPLOAD_DEST and are served
 * statically at /uploads (see main.ts). Filenames are randomised to avoid
 * collisions and path traversal from the original client filename.
 */
export const productImageMulterOptions: MulterOptions = {
  storage: diskStorage({
    destination: UPLOAD_DEST,
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase();
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
};
