import * as React from "react";
import { useState } from "react";
import { Box, Button, CssBaseline, TextField, Typography, Stack, Card, CircularProgress } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

const StyledCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  maxWidth: 450,
  borderRadius: "16px",
  backdropFilter: "blur(10px)",
  background: "rgba(255, 255, 255, 0.1)",
  boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.2)",
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: "0px 10px 40px rgba(0, 0, 0, 0.3)",
  },
}));

export default function SignIn({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      //console.log(data);
      if (response.ok) {
        localStorage.setItem("username", data.username);
        localStorage.setItem("company_id", data.company_id);
        localStorage.setItem("role", data.role);

        onLogin();
        
        if (data.role === "admin") {
          navigate("/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        setErrorMessage(data.error || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(to right, #0f2027, #2E3B55, rgb(27, 50, 60))",
          padding: 2,
        }}
      >
        <StyledCard>
          <Typography variant="h4" align="center" color="white">
            Sign in
          </Typography>
          {errorMessage && <Typography color="error">{errorMessage}</Typography>}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: "flex", flexDirection: "column", gap: 2, padding: 2 }}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
              sx={{
                "& .MuiInputBase-root": { bgcolor: "rgba(255, 255, 255, 0.2)", borderRadius: "8px", color: "white" },
                "& label": { color: "white" },
              }}
            />

            <TextField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              fullWidth
              sx={{
                "& .MuiInputBase-root": { bgcolor: "rgba(255, 255, 255, 0.2)", borderRadius: "8px", color: "white" },
                "& label": { color: "white" },
              }}
            />

            <Button type="submit" variant="contained" fullWidth sx={{ bgcolor: "#ff4081", color: "white", padding: "10px 20px", borderRadius: "10px" }} disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : "Sign in"}
            </Button>
          </Box>
        </StyledCard>
      </Box>
    </>
  );
}
