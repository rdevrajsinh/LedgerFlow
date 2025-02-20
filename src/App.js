import React, { useState, useEffect } from "react";
import { Route, Routes, useNavigate, Navigate } from "react-router-dom";
import { Box, CssBaseline, IconButton, useMediaQuery, useTheme, Menu, MenuItem, ListItemIcon, Typography,CircularProgress } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Sidebar from "./components/Sidebar";
import Customers from "./components/Customers";
import Vendors from "./components/Vendors";
import Estimates from "./components/Estimates";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import AddUser from "./components/AddUser";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CompanyForm from "./components/Company";
import Users from "./components/Users";
import CompanyLogo from "./components/Logo";


const theme = createTheme({
  typography: {
    fontFamily: "'Varela Round', sans-serif",
    fontWeightMedium: 10,
    fontcolor: "#29302b",
  },
});

const PrivateRoute = ({ children }) => {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");
  return isLoggedIn ? children : <Navigate to="/" />;
};


const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/check_session", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          sessionStorage.setItem("isLoggedIn", "true");
          sessionStorage.setItem("userRole", data.role);
        } else {
          setIsLoggedIn(false);
          sessionStorage.removeItem("isLoggedIn");
          sessionStorage.removeItem("userRole");
        }
      } catch (error) {
        console.error("Session check failed", error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionStorage.getItem("isLoggedIn")) {
      setIsLoggedIn(true);
      setLoading(false);
    } else {
      checkSession();
    }
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    sessionStorage.setItem("isLoggedIn", "true");
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    await fetch("http://localhost:5000/api/logout", { method: "POST", credentials: "include" });
    setIsLoggedIn(false);
    handleProfileMenuClose();
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("userRole");
    navigate("/");
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh', // Full height of the viewport
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isLoggedIn ? (
        <Box sx={{ display: "flex", marginTop: "10px" }}>
          <Box sx={{ position: "fixed", top: 0, left: 0, zIndex: 1300, width: "100%", backgroundColor: "#F8FAFC" }}>
            {isMobile && (
              <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleSidebarToggle} sx={{ mr: 2, position: "absolute", top: 10, left: 10 }}>
                <MenuIcon />
              </IconButton>
            )}
            <IconButton onClick={handleProfileMenuOpen} sx={{ position: "absolute", top: 5, right: 10 }}>
              <AccountCircleIcon fontSize="large" sx={{ color: "#2E3B55" }} />
            </IconButton>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleProfileMenuClose}>
              <MenuItem
                onClick={handleLogout}
                sx={{
                  "&:hover": {
                    backgroundColor: "rgba(38, 114, 235, 0.43)",
                  },
                }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="inherit">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
          <Sidebar isMobile={isMobile} isSidebarOpen={isSidebarOpen} handleSidebarToggle={handleSidebarToggle} />
          <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
            <Routes>
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/vendors" element={<PrivateRoute><Vendors /></PrivateRoute>} />
              <Route path="/estimates" element={<PrivateRoute><Estimates /></PrivateRoute>} />
              <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
              <Route path="/logo" element={<PrivateRoute><CompanyLogo /></PrivateRoute>} />
              <Route path="/add-user" element={<PrivateRoute><AddUser /></PrivateRoute>} />
              <Route path="/company" element={<PrivateRoute><CompanyForm /></PrivateRoute>} />
              <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
            </Routes>
          </Box>
        </Box>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </ThemeProvider>
  );
};

export default App;
