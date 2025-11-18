// src/theme/FormStyles.js
import { styled } from "@mui/material/styles";
import { Box, Paper, Dialog } from "@mui/material";

// Common form container styles
export const formContainerStyles = {
  maxWidth: "950px",
  width: "100%",
  margin: "0 auto",
};

// Styled Dialog for consistent form dialogs
export const StyledFormDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: 16,
    boxShadow: "0 12px 48px rgba(46, 125, 50, 0.15)",
    overflow: "hidden",
    width: "100%",
    maxWidth: "950px",
  },
}));

// Form header styles - use same green gradient used for primary buttons (consistent)
export const formHeaderStyles = {
  background: "linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)",
  color: "#FFFFFF !important",
  padding: "18px 28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxShadow: "0 4px 12px rgba(46, 125, 50, 0.2)",
};

// Form content wrapper
export const StyledFormContent = styled(Box)(({ theme }) => ({
  padding: "24px 28px",
  maxHeight: "calc(100vh - 220px)",
  overflowY: "auto",
  backgroundColor: "#FAFAFA",

  // Custom scrollbar
  "&::-webkit-scrollbar": {
    width: "8px",
  },
  "&::-webkit-scrollbar-track": {
    background: "#E8F5E9",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)",
    borderRadius: "4px",
    "&:hover": {
      background: "linear-gradient(135deg, #388E3C 0%, #4CAF50 100%)",
    },
  },
}));

// Form paper/card container
export const StyledFormPaper = styled(Paper)(({ theme }) => ({
  padding: "24px",
  borderRadius: "12px",
  backgroundColor: "#FFFFFF",
  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
  border: "1px solid #E8F5E9",
}));

// Field container - one field per row
export const fieldContainerStyles = {
  marginBottom: "18px",
  width: "100%",
  "&:last-child": {
    marginBottom: 0,
  },
};

// TextField styles
export const textFieldStyles = {
  width: "100%",
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#FFFFFF",
    borderRadius: "10px",
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: "#F1F8F1",
      "& fieldset": {
        borderColor: "#66BB6A",
      },
    },
    "&.Mui-focused": {
      backgroundColor: "#FFFFFF",
      "& fieldset": {
        borderColor: "#4CAF50",
        borderWidth: "2px",
      },
    },
  },
  "& .MuiInputLabel-root": {
    color: "#2E7D32",
    fontWeight: 500,
    "&.Mui-focused": {
      color: "#4CAF50",
      fontWeight: 600,
    },
  },
};

// Select field styles
export const selectFieldStyles = {
  ...textFieldStyles,
  "& .MuiSelect-select": {
    padding: "14px",
  },
};

// Form actions container
export const formActionsStyles = {
  padding: "16px 28px",
  backgroundColor: "#FAFAFA",
  borderTop: "1px solid #E8F5E9",
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
};

// Button styles
export const cancelButtonStyles = {
  borderRadius: "10px",
  padding: "10px 28px",
  fontWeight: 600,
  textTransform: "none",
  fontSize: "15px",
  borderColor: "#66BB6A",
  color: "#2E7D32",
  "&:hover": {
    borderColor: "#4CAF50",
    backgroundColor: "#F1F8F1",
  },
};

export const submitButtonStyles = {
  borderRadius: "10px",
  padding: "10px 32px",
  fontWeight: 600,
  textTransform: "none",
  fontSize: "15px",
  background: "linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)",
  boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
  "&:hover": {
    background: "linear-gradient(135deg, #388E3C 0%, #4CAF50 100%)",
    boxShadow: "0 6px 16px rgba(76, 175, 80, 0.4)",
    transform: "translateY(-1px)",
  },
  "&:disabled": {
    background: "#B0BEC5",
    boxShadow: "none",
  },
};

// Image upload container styles — reduced minHeight so the upload box is smaller
export const imageUploadContainerStyles = {
  width: "100%",
  padding: "18px",
  borderRadius: "12px",
  border: "2px dashed #66BB6A",
  backgroundColor: "#F1F8F1",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "all 0.3s ease",
  position: "relative",
  minHeight: "140px",
  "&:hover": {
    borderColor: "#4CAF50",
    backgroundColor: "#E8F5E9",
    transform: "translateY(-2px)",
    boxShadow: "0 8px 24px rgba(76, 175, 80, 0.15)",
  },
};

// Image preview styles (slightly smaller)
export const imagePreviewStyles = {
  width: "100px",
  height: "100px",
  borderRadius: "12px",
  border: "3px solid #4CAF50",
  boxShadow: "0 8px 24px rgba(76, 175, 80, 0.2)",
  objectFit: "cover",
  marginBottom: "12px",
};

// Section header styles
export const sectionHeaderStyles = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#2E7D32",
  marginBottom: "12px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

// Helper text styles
export const helperTextStyles = {
  marginTop: "8px",
  color: "#66BB6A",
  fontSize: "13px",
  fontWeight: 500,
};

// Form label styles
export const formLabelStyles = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#2E7D32",
  marginBottom: "8px",
  display: "block",
};

// Error message styles
export const errorTextStyles = {
  color: "#D32F2F",
  fontSize: "13px",
  marginTop: "4px",
  fontWeight: 500,
};
