// src/components/Modals/FormModal.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  DialogActions,
} from "@mui/material";
import { Close } from "@mui/icons-material";

const HEADER_GRADIENT = "linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)";

export default function FormModal({
  open,
  onClose,
  title,
  children,
  maxWidth = "lg",
  fullWidth = true,
  hideTitle = false, // set true when child already renders its own header
  contentSx = {}, // override DialogContent styles if needed
  actions = null, // optional actions node (DialogActions) from outside
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh",
          boxShadow: "0 12px 48px rgba(76,175,80,0.12)",
        },
      }}
      slotProps={{
        backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.48)" } },
      }}
    >
      {/* Header (form title) */}
      {!hideTitle && (
        <DialogTitle
          sx={{
            background: HEADER_GRADIENT,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 1.5,
            px: 3,
            flexShrink: 0,
          }}
        >
          <Box component="span" sx={{ fontWeight: 700, fontSize: 18 }}>
            {title}
          </Box>
          <IconButton
            onClick={onClose}
            sx={{ color: "#fff" }}
            aria-label="close"
          >
            <Close />
          </IconButton>
        </DialogTitle>
      )}

      {/* Content - this is the scroll container for the modal */}
      <DialogContent
        sx={{
          p: 0, // children must handle padding for consistent layouts
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          backgroundColor: "#fff",
          // custom scrollbar to match theme
          "&::-webkit-scrollbar": { width: 8 },
          "&::-webkit-scrollbar-track": {
            background: "#F1F8F1",
            borderRadius: 4,
          },
          "&::-webkit-scrollbar-thumb": {
            background: "linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)",
            borderRadius: 4,
          },
          ...contentSx,
        }}
      >
        {children}
      </DialogContent>

      {/* Optional actions supplied by consumer (keeps action area consistent across forms) */}
      {actions && (
        <DialogActions sx={{ px: 3, py: 2 }}>{actions}</DialogActions>
      )}
    </Dialog>
  );
}
