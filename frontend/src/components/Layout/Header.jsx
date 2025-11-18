// src/components/Layout/Header.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Badge,
  Tooltip,
  useTheme,
  Paper,
} from "@mui/material";
import {
  Menu as MenuIcon,
  AccountCircle,
  Notifications,
  Settings,
  Logout,
  Search,
  Brightness6,
} from "@mui/icons-material";
import { motion, useScroll, useTransform } from "framer-motion";
import { useDispatch } from "react-redux";
import { logout as logoutAction } from "../../store/authSlice";
import api from "../../services/api";
import toast from "react-hot-toast";

const Header = ({
  drawerWidth,
  handleDrawerToggle,
  isMobile,
  title,
  subtitle,
  Icon,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const { scrollY } = useScroll();

  // Transform scroll position to header background opacity
  const headerBg = useTransform(
    scrollY,
    [0, 50],
    ["rgba(232, 245, 232, 0.7)", "rgba(232, 245, 232, 0.95)"]
  );

  const headerShadow = useTransform(
    scrollY,
    [0, 50],
    ["0 4px 20px rgba(76, 175, 80, 0.1)", "0 8px 32px rgba(76, 175, 80, 0.2)"]
  );

  // Handle scroll visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show header when scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      }
      // Hide header when scrolling down and past 100px
      else if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Updated logout: call backend, dispatch redux action, toast, navigate
  const handleLogout = async () => {
    handleClose();
    try {
      // --- THIS IS THE FIX ---
      await api.post("/users/admin-logout"); // Call the new admin-logout route
      // --- END FIX ---

      dispatch(logoutAction()); // update redux auth state
      toast.success("Logged out successfully!");
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Logout failed");
    }
  };

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{
        y: isVisible ? 0 : -100,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8,
        },
      }}
      style={{
        position: "fixed",
        top: 0,
        left: isMobile ? 0 : drawerWidth,
        right: 0,
        zIndex: 1200,
      }}
    >
      <motion.div
        style={{
          background: headerBg,
          boxShadow: headerShadow,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            background: "transparent",
            backdropFilter: "blur(20px) saturate(180%)",
            borderRadius: 0,
            border: "1px solid rgba(76, 175, 80, 0.2)",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Animated Background Pattern */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(circle at 10% 20%, rgba(76, 175, 80, 0.1) 0%, transparent 20%),
                radial-gradient(circle at 80% 80%, rgba(102, 187, 106, 0.1) 0%, transparent 20%),
                radial-gradient(circle at 40% 40%, rgba(129, 199, 132, 0.05) 0%, transparent 20%)
              `,
              pointerEvents: "none",
            }}
          />

          {/* Floating Particles Animation */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: "absolute",
                  width: "4px",
                  height: "4px",
                  background: "rgba(76, 175, 80, 0.3)",
                  borderRadius: "50%",
                  left: `${20 + i * 30}%`,
                  top: "50%",
                }}
                animate={{
                  x: [0, 20, 0],
                  y: [0, -10, 0],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </Box>

          <Toolbar
            sx={{
              minHeight: { xs: 64, sm: 70 },
              px: { xs: 2, sm: 3 },
              position: "relative",
              zIndex: 1,
            }}
          >
            {isMobile && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{
                    mr: 2,
                    background: "rgba(76, 175, 80, 0.1)",
                    "&:hover": {
                      background: "rgba(76, 175, 80, 0.2)",
                    },
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
                {Icon && (
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      rotate: {
                        duration: 10,
                        repeat: Infinity,
                        ease: "linear",
                      },
                      scale: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }}
                  >
                    <Icon
                      sx={{
                        mr: 2,
                        display: { xs: "none", sm: "block" },
                        color: "primary.main",
                        fontSize: 28,
                        filter: "drop-shadow(0 2px 4px rgba(76, 175, 80, 0.3))",
                      }}
                    />
                  </motion.div>
                )}
                <Box>
                  <Typography
                    variant="h6"
                    noWrap
                    component="div"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "1.1rem", sm: "1.3rem" },
                      background:
                        "linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    {title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.75rem",
                      display: { xs: "none", sm: "block" },
                    }}
                  >
                    {subtitle}
                  </Typography>
                </Box>
              </Box>
            </motion.div>

            <Box sx={{ flexGrow: 1 }} />

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              {/* Theme Toggle */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Tooltip title="Toggle Theme">
                  <IconButton
                    color="inherit"
                    sx={{
                      background: "rgba(76, 175, 80, 0.1)",
                      "&:hover": {
                        background: "rgba(76, 175, 80, 0.2)",
                        transform: "translateY(-2px)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Brightness6 />
                  </IconButton>
                </Tooltip>
              </motion.div>

              {/* Notifications with Pulse Animation */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Tooltip title="Notifications">
                  <IconButton
                    color="inherit"
                    sx={{
                      background: "rgba(76, 175, 80, 0.1)",
                      "&:hover": {
                        background: "rgba(76, 175, 80, 0.2)",
                        transform: "translateY(-2px)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Badge
                      badgeContent={4}
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          animation: "pulse 2s infinite",
                          "@keyframes pulse": {
                            "0%": {
                              transform: "scale(1)",
                            },
                            "50%": {
                              transform: "scale(1.2)",
                            },
                            "100%": {
                              transform: "scale(1)",
                            },
                          },
                        },
                      }}
                    >
                      <Notifications />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </motion.div>

              {/* Settings */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Tooltip title="Settings">
                  <IconButton
                    color="inherit"
                    sx={{
                      background: "rgba(76, 175, 80, 0.1)",
                      "&:hover": {
                        background: "rgba(76, 175, 80, 0.2)",
                        transform: "translateY(-2px)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 180, 360] }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Settings />
                    </motion.div>
                  </IconButton>
                </Tooltip>
              </motion.div>

              {/* Profile Avatar */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Tooltip title="Account">
                  <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    color="inherit"
                    sx={{ ml: 1 }}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        background:
                          "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                        border: "3px solid rgba(76, 175, 80, 0.3)",
                        color: "white",
                        boxShadow: "0 4px 16px rgba(76, 175, 80, 0.3)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          boxShadow: "0 6px 20px rgba(76, 175, 80, 0.4)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <AccountCircle />
                    </Avatar>
                  </IconButton>
                </Tooltip>
              </motion.div>

              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                sx={{
                  "& .MuiPaper-root": {
                    borderRadius: 3,
                    minWidth: 200,
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 8px 32px rgba(76, 175, 80, 0.2)",
                    border: "1px solid rgba(76, 175, 80, 0.2)",
                    mt: 1.5,
                    overflow: "hidden",
                  },
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MenuItem
                    onClick={handleClose}
                    sx={{
                      "&:hover": {
                        background: "rgba(76, 175, 80, 0.1)",
                        transform: "translateX(5px)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    <AccountCircle sx={{ mr: 2, color: "primary.main" }} />
                    Profile
                  </MenuItem>
                  <MenuItem
                    onClick={handleClose}
                    sx={{
                      "&:hover": {
                        background: "rgba(76, 175, 80, 0.1)",
                        transform: "translateX(5px)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Settings sx={{ mr: 2, color: "primary.main" }} />
                    Settings
                  </MenuItem>
                  <MenuItem
                    onClick={handleLogout}
                    sx={{
                      "&:hover": {
                        background: "rgba(244, 67, 54, 0.1)",
                        transform: "translateX(5px)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Logout sx={{ mr: 2, color: "error.main" }} />
                    Logout
                  </MenuItem>
                </motion.div>
              </Menu>
            </motion.div>
          </Toolbar>
        </Paper>
      </motion.div>
    </motion.div>
  );
};

export default Header;
