import Product from "../models/Product.js";
import Category from "../models/Category.js";
import ImageService from "../services/imageService.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create product with images (NO variants or specifications)
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    shortDescription,
    category,
    brand,
    basePrice,
    discountPrice,
    tags,
    features,
    // 'specifications' removed
    status,
  } = req.body;

  // Validate category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return res.status(400).json({
      success: false,
      message: "Invalid category ID",
    });
  }

  let productImages = [];

  // Handle main product images
  if (req.files && req.files.images) {
    const imageFiles = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];

    // Validate images
    const validationErrors = ImageService.validateMultipleImages(imageFiles);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Image validation failed",
        errors: validationErrors,
      });
    }

    // Upload images
    const uploadedImages = await ImageService.uploadMultipleImages(
      imageFiles,
      "products"
    );
    productImages = uploadedImages.map((img, index) => ({
      ...img,
      isPrimary: index === 0,
      sortOrder: index,
      alt: `${name} - Image ${index + 1}`,
    }));
  }

  // --- All Variant Logic Removed ---

  // Generate slug
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const product = new Product({
    name,
    description,
    shortDescription,
    category,
    brand,
    images: productImages,
    // 'variants' field removed
    basePrice,
    discountPrice,
    // FIX: Accept tags and features as arrays, not strings
    tags: tags || [],
    features: features || [],
    // 'specifications' removed
    status: status || "draft",
    totalStock: 0, // Set default stock to 0
    slug: `${slug}-${Date.now()}`,
  });

  const savedProduct = await product.save();
  await savedProduct.populate("category");

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: savedProduct,
  });
});

// Get all products (This function remains unchanged)
export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    brand,
    status,
    featured,
    trending,
    minPrice,
    maxPrice,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build query
  const query = {};

  if (category) query.category = category;
  if (brand) query.brand = brand;
  if (status) query.status = status;
  if (featured !== undefined) query.featured = featured === "true";
  if (trending !== undefined) query.trending = trending === "true";

  if (minPrice || maxPrice) {
    query.basePrice = {};
    if (minPrice) query.basePrice.$gte = Number(minPrice);
    if (maxPrice) query.basePrice.$lte = Number(maxPrice);
  }

  if (search) {
    query.$text = { $search: search };
  }

  // Calculate pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Execute query with population
  const products = await Product.find(query)
    .populate("category", "name slug")
    .select("-__v")
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Product.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      products: products,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
        limit: Number(limit),
        hasNext: skip + Number(limit) < total,
        hasPrev: Number(page) > 1,
      },
    },
  });
});

// Get single product (This function remains unchanged)
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name slug description")
    .lean();

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  // Increment view count
  await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

  res.status(200).json({
    success: true,
    data: product,
  });
});

// Update product (Simplified)
export const updateProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const existingProduct = await Product.findById(productId);

  if (!existingProduct) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  const updateData = { ...req.body };

  // Handle new images
  if (req.files && req.files.images) {
    const imageFiles = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];
    const uploadedImages = await ImageService.uploadMultipleImages(
      imageFiles,
      "products"
    );

    const newImages = uploadedImages.map((img, index) => ({
      ...img,
      isPrimary: (existingProduct.images || []).length === 0 && index === 0,
      sortOrder: (existingProduct.images || []).length + index,
      alt: `${updateData.name || existingProduct.name} - Image ${
        (existingProduct.images || []).length + index + 1
      }`,
    }));

    updateData.images = [...(existingProduct.images || []), ...newImages];
  }

  // Handle image deletions
  if (req.body.deleteImages) {
    try {
      const imagesToDelete = JSON.parse(req.body.deleteImages);
      if (Array.isArray(imagesToDelete)) {
        let currentImages = updateData.images || existingProduct.images || [];
        for (const publicId of imagesToDelete) {
          await ImageService.deleteImage(publicId);
          currentImages = currentImages.filter(
            (img) => img.publicId !== publicId
          );
        }
        updateData.images = currentImages;
      }
    } catch (e) {
      console.error("Error parsing deleteImages: ", e);
    }
  }

  // FIX: tags and features are now arrays, remove string split logic
  // (Assuming frontend sends arrays for tags and features)
  if (updateData.tags && !Array.isArray(updateData.tags)) {
    // Fallback if old string data is sent
    updateData.tags = updateData.tags.split(",").map((tag) => tag.trim());
  }

  if (updateData.features && !Array.isArray(updateData.features)) {
    // Fallback if old string data is sent
    updateData.features = updateData.features
      .split(",")
      .map((feature) => feature.trim());
  }

  // REMOVE specifications
  if (updateData.specifications) {
    delete updateData.specifications;
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    updateData,
    { new: true, runValidators: true }
  ).populate("category");

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: updatedProduct,
  });
});

// Delete product (Simplified)
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  // Delete all product images
  const allImages = [...(product.images || [])];
  // --- Variant Image Logic Removed ---

  if (allImages.length > 0) {
    const publicIds = allImages.map((img) => img.publicId).filter(Boolean);
    if (publicIds.length > 0) {
      await ImageService.deleteMultipleImages(publicIds);
    }
  }

  await Product.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// Reorder product images (This function remains unchanged)
export const reorderProductImages = asyncHandler(async (req, res) => {
  const { imageOrder } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  // Reorder images based on provided order
  const reorderedImages = imageOrder
    .map((publicId, index) => {
      const image = product.images.find((img) => img.publicId === publicId);
      if (image) {
        return {
          ...image.toObject(),
          sortOrder: index,
          isPrimary: index === 0,
        };
      }
      return null;
    })
    .filter(Boolean);

  product.images = reorderedImages;
  await product.save();

  res.status(200).json({
    success: true,
    message: "Images reordered successfully",
    data: product,
  });
});

// Set primary image (This function remains unchanged)
export const setPrimaryImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  // Reset all images to non-primary
  product.images.forEach((img) => {
    img.isPrimary = img.publicId === publicId;
  });

  await product.save();

  res.status(200).json({
    success: true,
    message: "Primary image updated successfully",
  });
});
