// backend/middleware/uploadMiddleware.js
import multer from "multer";
import fs from "fs";
import path from "path";

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function createMulterForFolder(folderName = "others") {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadBase = path.join(process.cwd(), "uploads", folderName);
      ensureDirExists(uploadBase);
      cb(null, uploadBase);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}${ext}`;
      cb(null, name);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // optional: 5MB per file
  });

  return upload;
}

export default createMulterForFolder;
