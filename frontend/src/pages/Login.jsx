// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  ShoppingBag,
} from "@mui/icons-material";
// import { useAuth } from "../hooks/useAuth"; // 1. REMOVE
import { useDispatch } from "react-redux"; // 2. ADD
import { setCredentials } from "../store/authSlice"; // 3. ADD
import api from "../services/api"; // 4. ADD
import toast from "react-hot-toast";

const Login = () => {
  const [formData, setFormData] = useState({ userId: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // const { login } = useAuth(); // 5. REMOVE
  const navigate = useNavigate();
  const dispatch = useDispatch(); // 6. ADD

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 7. *** CHANGED: Call admin-login endpoint ***
      const res = await api.post("/users/admin-login", {
        email: formData.userId,
        password: formData.password,
      });

      // 8. Super admin check is now handled by backend
      // We just dispatch credentials on success
      dispatch(setCredentials(res.data)); // 9. Dispatch user info to Redux
      toast.success("Welcome back, Admin!");
      navigate("/");
    } catch (err) {
      // 10. Handle errors from the API
      const msg = err.response?.data?.message || err.message || "Login failed.";
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError("");
  };

  // ... (rest of the JSX is identical)
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #4CAF50 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
      }}
    >
      {/* ... (Animated Background) ... */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [-20, -100, -20],
              x: [-20, 20, -20],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              position: "absolute",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: 20 + i * 10,
              height: 20 + i * 10,
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
            }}
          />
        ))}
      </Box>

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card
            sx={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: 4,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{ textAlign: "center", marginBottom: "2rem" }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <ShoppingBag
                    sx={{ fontSize: 40, color: "primary.main", mr: 1 }}
                  />
                  <Typography
                    variant="h4"
                    component="h1"
                    color="primary"
                    fontWeight="bold"
                  >
                    Rathod Mart
                  </Typography>
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Admin Panel Login
                </Typography>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {error}
                  </Alert>
                </motion.div>
              )}

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="userId"
                    label="Email Address" // Changed label
                    name="userId"
                    autoComplete="email" // Changed autocomplete
                    autoFocus
                    value={formData.userId}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 3 }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{
                      mt: 1,
                      mb: 2,
                      py: 1.5,
                      fontSize: "1.1rem",
                      background: loading
                        ? "linear-gradient(135deg, #81C784 0%, #A5D6A7 100%)"
                        : "linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)",
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, #388E3C 0%, #4CAF50 100%)",
                      },
                    }}
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </motion.div>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Login;
