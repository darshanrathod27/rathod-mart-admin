import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  Box,
} from "@mui/material";
import { People, Category, Inventory } from "@mui/icons-material";
import { motion, useScroll, useTransform } from "framer-motion";

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { scrollY } = useScroll();

  // Transform scroll position for background opacity
  const backgroundOpacity = useTransform(scrollY, [0, 100], [0.95, 0.98]);

  const navigationItems = [
    { label: "Users", value: "/users", icon: People },
    { label: "Categories", value: "/categories", icon: Category },
    { label: "Products", value: "/products", icon: Inventory },
  ];

  // Handle scroll visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Show when scrolling up or near bottom
      if (
        currentScrollY < lastScrollY ||
        currentScrollY + windowHeight >= documentHeight - 50
      ) {
        setIsVisible(true);
      }
      // Hide when scrolling down
      else if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const getCurrentValue = () => {
    const currentPath = location.pathname;
    const item = navigationItems.find((item) => item.value === currentPath);
    return item ? currentPath : "/";
  };

  const handleChange = (event, newValue) => {
    navigate(newValue);
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{
        y: isVisible ? 0 : 100,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8,
        },
      }}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <Paper
        sx={{
          position: "relative",
          borderTop: "1px solid rgba(76, 175, 80, 0.2)",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px) saturate(180%)",
          overflow: "hidden",
        }}
        elevation={8}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              linear-gradient(180deg, rgba(241, 248, 233, 0.8) 0%, rgba(232, 245, 232, 0.9) 100%)
            `,
            pointerEvents: "none",
          }}
        />

        {/* Floating Particles */}
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
                width: "3px",
                height: "3px",
                background: "rgba(76, 175, 80, 0.4)",
                borderRadius: "50%",
                left: `${20 + i * 30}%`,
                top: "20%",
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 2 + i,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </Box>

        <BottomNavigation
          value={getCurrentValue()}
          onChange={handleChange}
          showLabels
          sx={{
            background: "transparent",
            position: "relative",
            zIndex: 1,
            "& .MuiBottomNavigationAction-root": {
              color: "text.secondary",
              transition: "all 0.3s ease",
              "&.Mui-selected": {
                color: "primary.main",
                "& .MuiBottomNavigationAction-label": {
                  fontSize: "0.75rem",
                  fontWeight: 600,
                },
              },
              "&:hover": {
                color: "primary.light",
                transform: "translateY(-2px)",
              },
            },
          }}
        >
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isSelected = getCurrentValue() === item.value;

            return (
              <BottomNavigationAction
                key={item.value}
                label={item.label}
                value={item.value}
                icon={
                  <motion.div
                    whileHover={{
                      scale: 1.2,
                      rotate: [0, -10, 10, 0],
                    }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.1 },
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {/* Active Indicator Background */}
                      {isSelected && (
                        <motion.div
                          layoutId="activeBackground"
                          style={{
                            position: "absolute",
                            top: -8,
                            left: -8,
                            right: -8,
                            bottom: -8,
                            background: "rgba(76, 175, 80, 0.1)",
                            borderRadius: "50%",
                            border: "2px solid rgba(76, 175, 80, 0.3)",
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        />
                      )}

                      {/* Icon with Badge */}
                      {item.label === "Users" ? (
                        <Badge
                          badgeContent={4}
                          color="primary"
                          variant="dot"
                          sx={{
                            "& .MuiBadge-badge": {
                              animation: isSelected
                                ? "pulse 1.5s infinite"
                                : "none",
                              "@keyframes pulse": {
                                "0%": { transform: "scale(1)" },
                                "50%": { transform: "scale(1.3)" },
                                "100%": { transform: "scale(1)" },
                              },
                            },
                          }}
                        >
                          <Icon
                            sx={{
                              fontSize: isSelected ? 26 : 24,
                              transition: "all 0.3s ease",
                              filter: isSelected
                                ? "drop-shadow(0 2px 4px rgba(76, 175, 80, 0.4))"
                                : "none",
                            }}
                          />
                        </Badge>
                      ) : (
                        <Icon
                          sx={{
                            fontSize: isSelected ? 26 : 24,
                            transition: "all 0.3s ease",
                            filter: isSelected
                              ? "drop-shadow(0 2px 4px rgba(76, 175, 80, 0.4))"
                              : "none",
                          }}
                        />
                      )}
                    </Box>
                  </motion.div>
                }
                sx={{
                  minWidth: "auto",
                  transition: "all 0.3s ease",
                  "&.Mui-selected": {
                    transform: "translateY(-3px)",
                  },
                }}
              />
            );
          })}
        </BottomNavigation>

        {/* Bottom Glow Effect */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "60%",
            height: "2px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(76, 175, 80, 0.5) 50%, transparent 100%)",
          }}
        />
      </Paper>
    </motion.div>
  );
};

export default MobileBottomNav;
