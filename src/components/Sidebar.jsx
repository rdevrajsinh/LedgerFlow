import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, List, ListItem, ListItemText, Typography, Drawer, Divider } from '@mui/material';
import { Dashboard, People, Store, Assignment, InsertComment, ManageAccounts } from '@mui/icons-material';
import axios from 'axios';

const Sidebar = ({ isMobile, isSidebarOpen, handleSidebarToggle }) => {
  const location = useLocation();
  const [companyLogo, setCompanyLogo] = useState(null);
  const [role, setRole] = useState('');

  useEffect(() => {
    const companyId = localStorage.getItem("company_id");
    const userRole = localStorage.getItem("role");
    
    setRole(userRole);

    if (companyId) {
      axios.get(`http://localhost:5000/api/company/${companyId}`, { responseType: 'blob' })
        .then(response => {
          const url = URL.createObjectURL(response.data);
          setCompanyLogo(url);
        })
        .catch(error => console.error('Error fetching company logo:', error));
    }
  }, []);

  const sidebarStyles = {
    backgroundColor: '#2E3B55',
    color: '#FFFFFF',
    width: '260px',
    height: '100%',
    padding: '8px',
  };

  const listItemStyles = {
    color: '#FFFFFF',
    textDecoration: 'none',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    padding: '6px 10px',
    transition: 'background-color 0.3s, transform 0.2s',
    '&:hover': {
      backgroundColor: '#3F51B5',
      transform: 'scale(1.03)',
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.2)',
    },
  };

  return (
    <Drawer
      sx={{
        width: 260,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 260,
          backgroundColor: '#2E3B55',
          color: '#FFFFFF',
          paddingTop: 0,
          boxShadow: 'none',
        },
      }}
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="left"
      open={isMobile ? isSidebarOpen : true}
      onClose={handleSidebarToggle}
      ModalProps={{ keepMounted: true }}
    >
      <Box sx={{ ...sidebarStyles }}>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '12px',
            padding: '8px',
          }}
        >
          {companyLogo && (
            <img
              src={companyLogo}
              alt="Company Logo"
              style={{ width: '80%', height: 'auto', borderRadius: '8px' }}
            />
          )}
        </Typography>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ textAlign: 'center', marginBottom: '12px', color: '#FFFFFF' }}
        >
          {role === 'admin' ? 'Admin' : ''}
        </Typography>
        
        <Typography variant="subtitle2" sx={{ padding: '8px', color: '#B0BEC5' }}>Main Navigation</Typography>
        <List>
          {[{ text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' }].map(({ text, icon, path }) => (
            <ListItem button component={Link} to={path} key={text} sx={{ ...listItemStyles, backgroundColor: location.pathname === path ? '#3F51B5' : 'transparent' }}>
              {icon}
              <ListItemText primary={text} sx={{ marginLeft: '20px', color: '#FFFFFF' }} />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ backgroundColor: '#FFFFFF20', marginY: 0.5 }} />

        <Typography variant="subtitle2" sx={{ padding: '8px', color: '#B0BEC5' }}>Management</Typography>
        <List>
          {[{ text: 'Customers', icon: <People />, path: '/customers' }, { text: 'Vendors', icon: <Store />, path: '/vendors' }, { text: 'Estimates', icon: <Assignment />, path: '/estimates' }].map(({ text, icon, path }) => (
            <ListItem button component={Link} to={path} key={text} sx={{ ...listItemStyles, backgroundColor: location.pathname === path ? '#3F51B5' : 'transparent' }}>
              {icon}
              <ListItemText primary={text} sx={{ marginLeft: '20px', color: '#FFFFFF' }} />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ backgroundColor: '#FFFFFF20', marginY: 0.5 }} />

        {role === 'admin' && (
          <>
            <Typography variant="subtitle2" sx={{ padding: '8px', color: '#B0BEC5' }}>Settings</Typography>
            <List>
              {[{ text: 'Company', icon: <InsertComment />, path: '/company' }, { text: 'Users', icon: <ManageAccounts />, path: '/users' }].map(({ text, icon, path }) => (
                <ListItem button component={Link} to={path} key={text} sx={{ ...listItemStyles, backgroundColor: location.pathname === path ? '#3F51B5' : 'transparent' }}>
                  {icon}
                  <ListItemText primary={text} sx={{ marginLeft: '20px', color: '#FFFFFF' }} />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
