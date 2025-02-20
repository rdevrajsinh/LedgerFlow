import React, { useState, useEffect } from 'react';
import { 
  TextField, Button, Box, Typography, Grid, Table, TableHead, 
  TableRow, TableCell, TableBody,InputAdornment, Autocomplete, TablePagination, Dialog, DialogActions, DialogContent, DialogTitle 
} from '@mui/material';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useTheme, useMediaQuery } from '@mui/material';

const Estimates = () => {
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageNumber, setPageNumber] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isEdit, setIsEdit] = useState(false); // To track whether we are editing or adding
  const [openDialog, setOpenDialog] = useState(false); // To control the popup modal
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Check if the screen is mobile size
  const role = localStorage.getItem("role");

  // Fetch customers data
  useEffect(() => {

    const companyId = localStorage.getItem("company_id");
    const role = localStorage.getItem("role");
    //console.log(role);
  const fetchCustomers = async () => {
    try {
      const response = await axios.get('https://ledger-flow-backend.vercel.app/api/customers',{
        headers: {
          'company': companyId,
          'role': role
        } 
      });
      setCustomers(response.data);
      //console.log(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };
  fetchCustomers();
}, []);
  // Handle form submission for both adding and editing
  const handleAddEstimate = async () => {
    if (customerId && amount) {
      try {
        if (isEdit) {
          // Update the estimate
          await axios.post(`https://ledger-flow-backend.vercel.app/api/add-estimate`, {
            customer_id: customerId,
            estimate: amount,
          });
          setIsEdit(false); // Reset to add mode
        } else {
          // Add new estimate
          await axios.post('https://ledger-flow-backend.vercel.app/api/add-estimate', {
            customer_id: customerId,
            estimate: amount,
          });
        }
        window.location.reload(); // ✅ Reload the page after submission
        setCustomerId('');
        setAmount('');
        setOpenDialog(false); // Close the dialog after submission
      } catch (error) {
        console.error('Error adding/editing estimate:', error);
      }
    } else {
      alert('Please fill in all fields.');
    }
  };

  // Filter customers for search functionality
  const filteredCustomers = customers.filter(customer => 
    customer.id.toString().includes(searchTerm.toLowerCase()) ||
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const sortedCustomers = [...filteredCustomers].sort((a, b) => b.id - a.id);


  const handleChangePage = (event, newPage) => {
    setPageNumber(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageNumber(0);
  };

  const paginatedCustomers = sortedCustomers.slice(pageNumber * rowsPerPage, (pageNumber + 1) * rowsPerPage);

  // Function to handle the Edit action and open the dialog
  const handleEditEstimate = (customer) => {
    setCustomerId(customer.id);
    setAmount(customer.estimate || ''); // Pre-fill the estimate amount
    setIsEdit(true); // Set to edit mode
    setOpenDialog(true); // Open the dialog
  };

  return (
    <Box>
 
    

      {/* Search Bar */}
      <Box sx={{ marginTop: 4, marginBottom: 2 }}>
  <Grid container spacing={3} alignItems="center">
    <Grid item xs={12} md={8}>
      <TextField
        sx={{ width: '30%' }} // Make the search input take full width
        label="Search by Customer Name or ID"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <SearchIcon sx={{ marginRight: 1 }} />
          ),
          sx: {
            borderRadius: 2, // Add border radius to the input
            '& .MuiOutlinedInput-notchedOutline': {
              borderRadius: 2, // Add border radius to the outline
            },
          },
        }}
      />
    </Grid>
    <Grid item xs={12} md={4} container spacing={2} alignItems="center">
 {/* <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
    <Typography variant="h5" sx={{ fontWeight: 600, color: '#2E3B55' }}>
      Add Estimate
    </Typography>
  </Grid>*/}

  <Grid item xs={8}>
    <Autocomplete
      options={customers}
      getOptionLabel={(customer) => `${customer.id} - ${customer.name}`}
      onChange={(event, newValue) => setCustomerId(newValue ? newValue.id : '')}
      value={customers.find(c => c.id === customerId) || null} // To display selected customer
      renderInput={(params) => (
        <TextField 
          {...params} 
          label="Select Customer" 
          fullWidth 
          variant="outlined" 
          sx={{ 
            borderRadius: 2, 
            '& .MuiOutlinedInput-notchedOutline': {
              borderRadius: 2,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#3F51B5', // Change border color on hover
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#3F51B5', // Change border color when focused
            },
          }} 
        />
      )}
    />
  </Grid>
  
  <Grid item xs={4}>
    <Button
      variant="contained"
      color="primary"
      onClick={() => setOpenDialog(true)} // Open the dialog to add estimate
      startIcon={<AddIcon />} // Add the icon here
      sx={{ 
        borderRadius: 2, 
        width: '100%', // Full width
        padding: '10px 20px', // Add padding for a better button size
        '&:hover': {
          backgroundColor: '#0056b3', // Darker shade on hover
        },
      }}
    >
     {!isMobile && 'Estimate'}
    </Button>
  </Grid>
</Grid>
</Grid>
</Box>



      <Typography variant="h5" sx={{ marginTop: 4 }}>
         Estimates Record
      </Typography>
      <Table sx={{ marginTop: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell> ID </TableCell>
            <TableCell>Customer Name</TableCell>
            <TableCell>Estimate Amount(₹)</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedCustomers.map((customer, index) => (
            <TableRow key={index}>
              <TableCell>{customer.id}</TableCell>
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.estimate || 'N/A'}</TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => handleEditEstimate(customer)}
                  disabled={role !== 'admin'} // Disable the button if the user is not an admin

                >
                  Edit Estimate
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={filteredCustomers.length}
        rowsPerPage={rowsPerPage}
        page={pageNumber}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Edit Estimate Dialog (Popup) */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{isEdit ? 'Edit Estimate' : 'Add Estimate'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer ID"
                value={customerId}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={customers.find(c => c.id === customerId)?.name || ''}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Estimate Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleAddEstimate} color="primary">
            {isEdit ? 'Update Estimate' : 'Add Estimate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Estimates;
