// src/theme/theme.js
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2E7D32", // Forest Green
      light: "#4CAF50", // Light Green
      dark: "#1B5E20", // Dark Green
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#66BB6A", // Medium Green
      light: "#81C784", // Lighter Green
      dark: "#388E3C", // Darker Green
      contrastText: "#ffffff",
    },
    success: {
      main: "#4CAF50",
      light: "#81C784",
      dark: "#388E3C",
    },
    background: {
      default: "#F1F8E9", // Very Light Green
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1B5E20",
      secondary: "#2E7D32",
    },
    divider: "#C8E6C9",
    action: {
      hover: "rgba(76, 175, 80, 0.08)",
      selected: "rgba(76, 175, 80, 0.12)",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: "1.5rem",
      color: "#1B5E20",
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
      color: "#2E7D32",
    },
    h6: {
      fontWeight: 600,
      fontSize: "1.1rem",
      color: "#2E7D32",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 24px",
          boxShadow: "0 4px 14px 0 rgba(76, 175, 80, 0.2)",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 6px 20px 0 rgba(76, 175, 80, 0.3)",
          },
        },
        contained: {
          background: "linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 8px 32px 0 rgba(76, 175, 80, 0.1)",
          backdrop: "blur(20px)",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 40px 0 rgba(76, 175, 80, 0.15)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 20px 0 rgba(76, 175, 80, 0.08)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
          boxShadow: "0 4px 20px 0 rgba(46, 125, 50, 0.2)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: "linear-gradient(180deg, #FFFFFF 0%, #F1F8E9 100%)",
          borderRight: "1px solid rgba(200, 230, 201, 0.3)",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: "4px 8px",
          "&.Mui-selected": {
            background: "linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)",
            },
          },
          "&:hover": {
            background: "rgba(76, 175, 80, 0.08)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            "&:hover fieldset": {
              borderColor: "#66BB6A",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#4CAF50",
            },
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 12,
  },
});
