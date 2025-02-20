import * as React from "react";
import { useState, useEffect } from "react";
import { Box, Button, CssBaseline, TextField, Typography, Card, CircularProgress, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
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

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user"); // Default role: user
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch companies from backend
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch("https://ledger-flow-backend.vercel.app/api/companies");
        const data = await response.json();
        setCompanies(data);
      } catch (error) {
        console.error("Error fetching companies:", error);
        setErrorMessage("Failed to load companies.");
      }
    };

    fetchCompanies();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    // If the role is admin, set company_id to null
    const companyId = role === "admin" ? null : selectedCompany;

    if (role !== "admin" && !selectedCompany) {
      setErrorMessage("Please select a company.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("https://ledger-flow-backend.vercel.app/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password, role, company_id: companyId }),
      });

      const data = await response.json();

      if (response.status === 200 || response.status === 201) {
        setErrorMessage("");
        navigate("/dashboard");
      } else {
        setErrorMessage(data.error || "An error occurred during registration.");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setErrorMessage("An error occurred. Please check your network connection.");
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
          background: "white",
          padding: 2,
        }}
      >
        <StyledCard sx={{ background: 'linear-gradient(to right, #0f2027, #2E3B55, rgb(27, 50, 60))', width: "100%" }}>
          <Typography variant="h4" align="center" color="white">
            New User
          </Typography>
          {errorMessage && <Typography color="error">{ errorMessage}</Typography>}

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

            <TextField
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              required
              fullWidth
              sx={{
                "& .MuiInputBase-root": { bgcolor: "rgba(255, 255, 255, 0.2)", borderRadius: "8px", color: "white" },
                "& label": { color: "white" },
              }}
            />

            {/* Role selection */}
            <FormControl fullWidth>
              <InputLabel sx={{ color: "white" }}>Role</InputLabel>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "white",
                  "& .MuiSvgIcon-root": { color: "white" },
                }}
              >
                <MenuItem value="user">User </MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

            {/* Company selection */}
            <FormControl fullWidth>
              <InputLabel sx={{ color: "white" }}>Select Company</InputLabel>
              <Select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                disabled={role === "admin"} // Disable if role is admin
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "white",
                  "& .MuiSvgIcon-root": { color: "white" },
                }}
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button type="submit" variant="contained" fullWidth sx={{ bgcolor: "#bb2ee6", color: "white", "&:hover": { bgcolor: "#303f9f" } }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : "Register"}
            </Button>
          </Box>
        </StyledCard>
      </Box>
    </>
  );
} 
