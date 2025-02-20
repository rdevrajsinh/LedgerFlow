import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedUser  , setSelectedUser  ] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('');
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('https://ledger-flow-backend.vercel.app/api/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const fetchCompanies = async () => {
      try {
        const response = await axios.get('https://ledger-flow-backend.vercel.app/api/companies');
        setCompanies(response.data);
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchUsers();
    fetchCompanies();
  }, []);

  const handleEditUser   = (user) => {
    setSelectedUser  (user);
    setSelectedCompany(user.company_id); // Assuming user has a company_id field
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedUser  (null);
    setSelectedCompany('');
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSelectedUser  ({
      ...selectedUser  ,
      [name]: value,
    });
  };

  const handleCompanyChange = (event) => {
    setSelectedCompany(event.target.value);
  };

  const handleUpdateUser   = async () => {
    try {
      const updateData = {
        ...selectedUser  ,
        company_id: selectedUser .role === 'admin' ? null : selectedCompany, // Set company_id to null if role is admin
      };

      console.log('Updating user with data:', updateData); // Log the data being sent

      await axios.put(`https://ledger-flow-backend.vercel.app/api/users/${selectedUser .id}`, updateData);
      setUsers(users.map(user => (user.id === selectedUser .id ? selectedUser   : user)));
      handleCloseEditDialog();
      window.location.reload(); // Reload the page after submission
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <Box>
      <Button variant="contained" color="primary" onClick={() => navigate('/add-user')} sx={{ marginBottom: 2 }}>
        Add User
      </Button>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Password</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.password}</TableCell>
                <TableCell>
                  {companies.find(company => company.id === user.company_id)?.name || 'N/A'}
                </TableCell> {/* Display company name */}
                <TableCell>
                  <Button variant="contained" color="primary" onClick={() => handleEditUser  (user)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            name="name"
            value={selectedUser ?.name || ''}
            onChange={ handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Password"
            name="password" // Change to password
            value={selectedUser ?.password || ''}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Company</InputLabel>
            <Select
              value={selectedCompany}
              onChange={handleCompanyChange}
              disabled={selectedUser ?.role === 'admin'} // Disable if role is admin
              required
            >
              {companies.map(company => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={selectedUser ?.role || ''}
              onChange={handleInputChange}
              required
            >
              <MenuItem value="user">User  </MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleUpdateUser  } color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
