import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
} from "@mui/material";
import { Close } from "@mui/icons-material";

/**
 * Reusable modal component for forms
 * @param {boolean} open - Controls modal visibility
 * @param {function} onClose - Handler for closing modal
 * @param {string} title - Modal title
 * @param {React.ReactNode} children - Form content
 * @param {string} maxWidth - Maximum width of modal (xs, sm, md, lg, xl)
 */
const FormModal = ({ open, onClose, title, children, maxWidth = "md" }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "divider",
          pb: 2,
        }}
      >
        <Box component="span" sx={{ fontWeight: 600, fontSize: "1.25rem" }}>
          {title}
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "text.secondary",
            "&:hover": { color: "error.main" },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>{children}</DialogContent>
    </Dialog>
  );
};

export default FormModal;
