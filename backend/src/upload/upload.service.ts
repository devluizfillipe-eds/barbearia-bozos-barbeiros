import { Injectable, BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import * as multer from 'multer';
import * as crypto from 'crypto';

@Injectable()
export class UploadService {
  private storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, callback) => {
      const randomName = crypto.randomBytes(16).toString('hex');
      return callback(null, `${randomName}${extname(file.originalname)}`);
    },
  });

  getMulterConfig() {
    return {
      storage: this.storage,
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return callback(
            new BadRequestException('Apenas imagens são permitidas.'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    };
  }
}
