// upload/gridfs.js
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import crypto from 'crypto';
import path from 'path';


export function createGridFsUpload(mongoUri, options = {}) {
const maxFileSize = options.maxFileSize || parseInt(process.env.MAX_FILE_SIZE || '1073741824', 10);
const storage = new GridFsStorage({
url: mongoUri,
file: (req, file) => {
const ext = path.extname(file.originalname);
const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
return { filename, bucketName: 'videos' };
}
});


return multer({ storage, limits: { fileSize: maxFileSize } });
}