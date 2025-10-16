import React, { useState, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Grid,
  Card,
  CardMedia,
  CardActions,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Tooltip,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Edit as EditIcon,
  ZoomIn as ZoomIcon,
  DragIndicator as DragIcon,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import toast from "react-hot-toast";

const ImageUploadManager = ({
  images = [],
  onImagesChange,
  maxImages = 10,
  folder = "products",
  enableReorder = true,
  enableCrop = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const fileInputRef = useRef(null);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (acceptedFiles) => {
      if (images.length + acceptedFiles.length > maxImages) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      setUploading(true);
      const uploadPromises = acceptedFiles.map(async (file, index) => {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("folder", folder);

        try {
          setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

          const response = await fetch("/api/upload/image", {
            method: "POST",
            body: formData,
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
            },
          });

          if (!response.ok) throw new Error("Upload failed");

          const result = await response.json();
          return {
            ...result.data,
            isPrimary: images.length === 0 && index === 0,
            sortOrder: images.length + index,
            alt: file.name.split(".")[0],
          };
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
          throw error;
        } finally {
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }
      });

      try {
        const uploadedImages = await Promise.all(uploadPromises);
        onImagesChange([...images, ...uploadedImages]);
        toast.success(
          `${uploadedImages.length} image(s) uploaded successfully`
        );
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setUploading(false);
      }
    },
    [images, maxImages, folder, onImagesChange]
  );

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading || images.length >= maxImages,
  });

  // Handle image deletion
  const handleDeleteImage = (publicId) => {
    const updatedImages = images.filter((img) => img.publicId !== publicId);

    // If deleted image was primary, make first image primary
    if (updatedImages.length > 0) {
      const deletedImage = images.find((img) => img.publicId === publicId);
      if (deletedImage?.isPrimary) {
        updatedImages[0].isPrimary = true;
      }
    }

    onImagesChange(updatedImages);
    toast.success("Image deleted");
  };

  // Handle setting primary image
  const handleSetPrimary = (publicId) => {
    const updatedImages = images.map((img) => ({
      ...img,
      isPrimary: img.publicId === publicId,
    }));
    onImagesChange(updatedImages);
    toast.success("Primary image updated");
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedImages = Array.from(images);
    const [reorderedItem] = reorderedImages.splice(result.source.index, 1);
    reorderedImages.splice(result.destination.index, 0, reorderedItem);

    // Update sort order
    const updatedImages = reorderedImages.map((img, index) => ({
      ...img,
      sortOrder: index,
      isPrimary:
        index === 0
          ? true
          : img.isPrimary && index !== 0
          ? false
          : img.isPrimary,
    }));

    onImagesChange(updatedImages);
  };

  // Handle image editing
  const handleEditImage = (image) => {
    setEditingImage({ ...image });
  };

  const handleSaveImageEdit = () => {
    const updatedImages = images.map((img) =>
      img.publicId === editingImage.publicId ? editingImage : img
    );
    onImagesChange(updatedImages);
    setEditingImage(null);
    toast.success("Image updated");
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Product Images ({images.length}/{maxImages})
      </Typography>

      {/* Upload Area */}
      <Box
        {...getRootProps()}
        sx={{
          border: "2px dashed",
          borderColor: isDragActive ? "primary.main" : "grey.300",
          borderRadius: 2,
          p: 3,
          textAlign: "center",
          cursor: uploading ? "not-allowed" : "pointer",
          bgcolor: isDragActive ? "action.hover" : "background.paper",
          mb: 3,
          transition: "all 0.2s ease",
        }}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        <UploadIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive
            ? "Drop images here..."
            : "Drag & drop images or click to browse"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supports: JPG, PNG, WebP, GIF (Max: 10MB each)
        </Typography>

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">Uploading...</Typography>
            {Object.entries(uploadProgress).map(([filename, progress]) => (
              <Box key={filename} sx={{ mt: 1 }}>
                <Typography variant="caption">{filename}</Typography>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Image Grid */}
      {images.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="images" direction="horizontal">
            {(provided) => (
              <Grid
                container
                spacing={2}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {images.map((image, index) => (
                  <Draggable
                    key={image.publicId}
                    draggableId={image.publicId}
                    index={index}
                    isDragDisabled={!enableReorder}
                  >
                    {(provided, snapshot) => (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={4}
                        lg={3}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <Card
                          sx={{
                            position: "relative",
                            transform: snapshot.isDragging
                              ? "rotate(5deg)"
                              : "none",
                            boxShadow: snapshot.isDragging ? 3 : 1,
                            transition: "transform 0.2s ease",
                          }}
                        >
                          {/* Drag Handle */}
                          {enableReorder && (
                            <Box
                              {...provided.dragHandleProps}
                              sx={{
                                position: "absolute",
                                top: 4,
                                left: 4,
                                zIndex: 2,
                                bgcolor: "rgba(0,0,0,0.5)",
                                borderRadius: 1,
                                p: 0.5,
                              }}
                            >
                              <DragIcon sx={{ color: "white", fontSize: 16 }} />
                            </Box>
                          )}

                          {/* Primary Badge */}
                          {image.isPrimary && (
                            <Chip
                              label="Primary"
                              size="small"
                              color="primary"
                              sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                zIndex: 2,
                              }}
                            />
                          )}

                          <CardMedia
                            component="img"
                            height="200"
                            image={image.thumbnailUrl || image.url}
                            alt={image.alt}
                            sx={{
                              objectFit: "cover",
                              cursor: "pointer",
                            }}
                            onClick={() => setSelectedImage(image)}
                          />

                          <CardActions
                            sx={{ p: 1, justifyContent: "space-between" }}
                          >
                            <Box>
                              <Tooltip title="Set as primary">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleSetPrimary(image.publicId)
                                  }
                                  disabled={image.isPrimary}
                                >
                                  {image.isPrimary ? (
                                    <StarIcon color="primary" />
                                  ) : (
                                    <StarBorderIcon />
                                  )}
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Edit image">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditImage(image)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="View full size">
                                <IconButton
                                  size="small"
                                  onClick={() => setSelectedImage(image)}
                                >
                                  <ZoomIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>

                            <Tooltip title="Delete image">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  handleDeleteImage(image.publicId)
                                }
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </CardActions>
                        </Card>
                      </Grid>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Grid>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Image Preview
          <IconButton
            onClick={() => setSelectedImage(null)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <DeleteIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box textAlign="center">
              <img
                src={selectedImage.largeUrl || selectedImage.url}
                alt={selectedImage.alt}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Edit Dialog */}
      <Dialog
        open={!!editingImage}
        onClose={() => setEditingImage(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Image</DialogTitle>
        <DialogContent>
          {editingImage && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Alt Text"
                value={editingImage.alt || ""}
                onChange={(e) =>
                  setEditingImage((prev) => ({
                    ...prev,
                    alt: e.target.value,
                  }))
                }
                margin="normal"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={editingImage.isPrimary || false}
                    onChange={(e) =>
                      setEditingImage((prev) => ({
                        ...prev,
                        isPrimary: e.target.checked,
                      }))
                    }
                  />
                }
                label="Set as Primary Image"
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingImage(null)}>Cancel</Button>
          <Button onClick={handleSaveImageEdit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageUploadManager;
