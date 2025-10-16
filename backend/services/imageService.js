import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class ImageService {
  constructor() {
    this.supportedFormats = ["jpg", "jpeg", "png", "webp", "gif"];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.imageSizes = {
      thumbnail: { width: 200, height: 200 },
      medium: { width: 600, height: 600 },
      large: { width: 1200, height: 1200 },
    };
  }

  async processAndUploadImage(buffer, filename, folder = "products") {
    try {
      // Generate unique filename
      const uniqueFilename = `${uuidv4()}-${filename}`;

      // Process image with Sharp for optimization
      const processedImage = await sharp(buffer)
        .resize(1200, 1200, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 90, progressive: true })
        .toBuffer();

      // Upload to Cloudinary with auto format and quality
      const uploadResult = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${processedImage.toString("base64")}`,
        {
          folder: `rathod-mart/${folder}`,
          public_id: uniqueFilename.split(".")[0],
          transformation: [{ quality: "auto:good" }, { fetch_format: "auto" }],
          eager: [
            {
              width: this.imageSizes.thumbnail.width,
              height: this.imageSizes.thumbnail.height,
              crop: "fill",
              quality: "auto:good",
              fetch_format: "auto",
            },
            {
              width: this.imageSizes.medium.width,
              height: this.imageSizes.medium.height,
              crop: "fit",
              quality: "auto:good",
              fetch_format: "auto",
            },
          ],
        }
      );

      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        thumbnailUrl: uploadResult.eager[0].secure_url,
        mediumUrl: uploadResult.eager[1].secure_url,
        largeUrl: uploadResult.secure_url,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes,
      };
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  async uploadMultipleImages(files, folder = "products") {
    const uploadPromises = files.map((file) =>
      this.processAndUploadImage(file.buffer, file.originalname, folder)
    );

    return Promise.all(uploadPromises);
  }

  async deleteImage(publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.error("Error deleting image:", error);
      return false;
    }
  }

  async deleteMultipleImages(publicIds) {
    try {
      await cloudinary.api.delete_resources(publicIds);
      return true;
    } catch (error) {
      console.error("Error deleting multiple images:", error);
      return false;
    }
  }

  validateImage(file) {
    const errors = [];

    if (!file) {
      errors.push("No file provided");
      return errors;
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(
        `File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`
      );
    }

    // Check file format
    const fileExtension = file.originalname.split(".").pop().toLowerCase();
    if (!this.supportedFormats.includes(fileExtension)) {
      errors.push(
        `Unsupported format. Allowed: ${this.supportedFormats.join(", ")}`
      );
    }

    return errors;
  }

  validateMultipleImages(files) {
    const errors = [];

    if (!files || files.length === 0) {
      errors.push("No files provided");
      return errors;
    }

    if (files.length > 10) {
      errors.push("Maximum 10 images allowed per upload");
    }

    files.forEach((file, index) => {
      const fileErrors = this.validateImage(file);
      if (fileErrors.length > 0) {
        errors.push(`File ${index + 1}: ${fileErrors.join(", ")}`);
      }
    });

    return errors;
  }
}

export default new ImageService();
