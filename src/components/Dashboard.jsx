import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableHead,
  TableRow,
  Paper,
  Menu,
  MenuItem,
  IconButton,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTheme, useMediaQuery } from '@mui/material';

const Dashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [openCustomerDetails, setOpenCustomerDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerEstimates, setCustomerEstimates] = useState([]);
  const [vendorEstimates, setVendorEstimates] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5); // Set default rows per page
  const [count, setCount] = useState(0);
  const [openPendingCustomerDialog, setOpenPendingCustomerDialog] = useState(false);
  const [openPendingVendorDialog, setOpenPendingVendorDialog] = useState(false);
  const [pendingCustomers, setPendingCustomers] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]);
  // Pagination states
  const [customerPage, setCustomerPage] = useState(0);
  const [customerRowsPerPage, setCustomerRowsPerPage] = useState(5);
  const [vendorPage, setVendorPage] = useState(0);
  const [vendorRowsPerPage, setVendorRowsPerPage] = useState(5);


  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to the first page when rows per page changes
  };

  // Sample data for the line chart
  const data = [
    { name: 'Jan', received: 4000, given: 2400 },
    { name: 'Feb', received: 3000, given: 1398 },
    { name: 'Mar', received: 2000, given: 9800 },
    { name: 'Apr', received: 2780, given: 3908 },
    { name: 'May', received: 1890, given: 4800 },
    { name: 'Jun', received: 2390, given: 3800 },
    { name: 'Jul', received: 3490, given: 4300 },
  ];

  const totalReceived = data.reduce((acc, curr) => acc + curr.received, 0);
  const totalGiven = data.reduce((acc, curr) => acc + curr.given, 0);

  useEffect(() => {
    const customerData = {};
    const vendorData = {};
  
    // Retrieve companyid and role from localStorage
    const companyId = localStorage.getItem("company_id");
    const role = localStorage.getItem("role");
  
    // Fetch customers from the API with headers
    axios.get('https://ledger-flow-backend.vercel.app/api/customers', {
      headers: {
        'company': companyId,
        'role': role
      }
    })
    .then(response => {
      setCustomers(response.data);
      const estimates = response.data.map(customer => {
        const estimate = customer.estimate ? parseFloat(customer.estimate.replace(/^0+/, '')) : 0;
        return estimate;
      });
      setCustomerEstimates(estimates);
  
      const venestimate = response.data.map(customer => {
        const venestimate = customer.vendor_estimate ? parseFloat(customer.vendor_estimate.replace(/^0+/, '')) : 0;
        return venestimate;
      });
      setVendorEstimates(venestimate);
  
      response.data.forEach(customer => {
        const estimate = customer.estimate ? parseFloat(customer.estimate.replace(/^0+/, '')) : 0;
        const vendorEstimate = customer.vendor_estimate ? parseFloat(customer.vendor_estimate.replace(/^0+/, '')) : 0;
  
        const deliveredMonth = customer.delivered_date ? new Date(customer.delivered_date).toLocaleString('en-US', { month: 'short' }) : null;
        const receivedMonth = customer.received_vendor_date ? new Date(customer.received_vendor_date).toLocaleString('en-US', { month: 'short' }) : null;
  
        if (deliveredMonth) {
          if (!customerData[deliveredMonth]) customerData[deliveredMonth] = 0;
          customerData[deliveredMonth] += estimate;
        }
  
        if (receivedMonth) {
          if (!vendorData[receivedMonth]) vendorData[receivedMonth] = 0;
          vendorData[receivedMonth] += vendorEstimate;
        }
      });
  
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedData = months.map(month => ({
        name: month,
        received: customerData[month] || 0,
        given: vendorData[month] || 0
      }));
  
      setChartData(formattedData);
    })
    .catch(error => console.error(error));
  
    // Fetch vendors from the API with headers
    axios.get('https://ledger-flow-backend.vercel.app/api/vendors')
    .then(response => {
      setVendors(response.data);
    })
    .catch(error => console.error(error));
  }, []);
  

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearch(value);

    const filteredData = customers.filter(customer =>
      customer.phone && customer.phone.includes(value) // Check if phone is defined
    );
    setCount(filteredData.length);
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterSelect = (filterOption) => {
    setFilter(filterOption);
    handleFilterClose();
  };
  const handleOpenPendingCustomers = () => {
    //console.log("Pending Customers clicked"); // Debug log
    const pendingCustomers = customers.filter(customer => !customer.delivered_date);
    setPendingCustomers(pendingCustomers);
    setOpenPendingCustomerDialog(true); // This should open the dialog
  };
  
  const handleOpenPendingVendors = () => {
   // console.log("Pending Vendors clicked"); // Debug log
  
    // Filter vendors based on their associated customers' received_vendor_date
    const pendingVendorsList = vendors.filter(vendor => {
      // Get all customers associated with this vendor
      const associatedCustomers = customers.filter(customer => customer.vendor_id === vendor[0]);
      
      // Check if any associated customer does not have a received_vendor_date
      return associatedCustomers.some(customer => !customer.received_vendor_date);
    });
  
    // Log the filtered pending vendors
  //  console.log("Filtered Pending Vendors:", pendingVendorsList);
  
    // Map through the pending vendors and group customers by vendor ID
    const vendorsWithCustomers = pendingVendorsList.map(vendor => {
      const vendorId = vendor[0]; // Get the vendor ID from the first element
      const vendorName = vendor[1]; // Get the vendor name from the second element
  
      // Get all customers associated with this vendor
      const assignedCustomers = customers.filter(customer => customer.vendor_id === vendorId);
    //  console.log(`Vendor ID: ${vendorId}, Name: ${vendorName}, Assigned Customers:`, assignedCustomers); // Log each vendor's details
      return {
        vendorName: vendorName, // Use the destructured name
        vendorId: vendorId,     // Use the destructured ID
        assignedCustomers: assignedCustomers,
      };
    });
  
    // Log the vendors with customers
   // console.log("Vendors with Customers:", vendorsWithCustomers);
  
    // Set the state for pending vendors
    setPendingVendors(vendorsWithCustomers);
    setOpenPendingVendorDialog(true); // This should open the dialog
  };



  const handleCustomerChangePage = (event, newPage) => {
    setCustomerPage(newPage);
  };

  const handleCustomerChangeRowsPerPage = (event) => {
    setCustomerRowsPerPage(parseInt(event.target.value, 10));
    setCustomerPage(0);
  };

  // Vendor Pagination Handlers
  const handleVendorChangePage = (event, newPage) => {
    setVendorPage(newPage);
  };

  const handleVendorChangeRowsPerPage = (event) => {
    setVendorRowsPerPage(parseInt(event.target.value, 10));
    setVendorPage(0);
  };


  // Filter functions
  const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return new Date(date).toDateString() === yesterday.toDateString();
  };

  const isLastWeek = (date) => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    return new Date(date) >= lastWeek;
  };

  const isLastMonth = (date) => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return new Date(date) >= lastMonth;
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.phone && customer.phone.includes(search); // Ensure phone is defined
    const matchesFilter = filter === 'all' ||
      (filter === 'yesterday' && isYesterday(customer.received_date)) ||
      (filter === 'lastWeek' && isLastWeek(customer.received_date)) ||
      (filter === 'lastMonth' && isLastMonth(customer.received_date));
    return matchesSearch && matchesFilter;
  });

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setOpenCustomerDetails(true);
  };

  const handleCloseCustomerDetails = () => {
    setOpenCustomerDetails(false);
  };

  const pendingCustomersCount = customers.filter(customer => !customer.delivered_date).length;
  const pendingVendorsCount = customers.filter(vendor => vendor.vendor_id && !vendor.received_vendor_date).length;

  const totalCustomerEstimate = customerEstimates.reduce((acc, curr) => acc + curr, 0);
  const totalVendorEstimate = vendorEstimates.reduce((acc, curr) => acc + curr, 0);
  const finalamount = totalCustomerEstimate - totalVendorEstimate;

  const sortedCustomers = [...filteredCustomers].sort((a, b) => b.id - a.id);

  const paginatedCustomers = sortedCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{
      padding: 3,
      height: '100vh',
      fontFamily: '"Lora", serif',
    
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <Grid container spacing={3} justifyContent="center" sx={{ marginTop: 1 }}>
  {/* Stats Boxes */}
  <Grid container spacing={3} justifyContent="center">
    <Grid item xs={12} sm={6} md={3} onClick={handleOpenPendingCustomers}>
      <Box
       
        sx={{
          padding: 2,
          backgroundColor: '#3F51B5',
          height: { xs: '110px', md: '140px' }, // Adjust height for mobile
          color: '#FFFFFF',
          borderRadius: 2,
          boxShadow: 3,
          textAlign: 'center',
          alignContent: 'center',
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': { transform: 'scale(1.05)', boxShadow: 6 },
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 300 }}>Pending Customers</Typography>
        <Typography variant="h4" sx={{ fontWeight: 400 }}>{pendingCustomersCount}</Typography>
      </Box>
    </Grid>
    <Grid item xs={12} sm={6} md={3} onClick={handleOpenPendingVendors}>
      <Box
      
        sx={{
          padding: 2,
          backgroundColor: '#bb2ee6',
          height: { xs: '120px', md: '150px' },
          alignContent: 'center',
          color: '#FFFFFF',
          borderRadius: 2,
          boxShadow: 3,
          textAlign: 'center',
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': { transform: 'scale(1.05)', boxShadow: 6 },
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 300 }}>Pending Vendors</Typography>
        <Typography variant="h4" sx={{ fontWeight: 400 }}>{pendingVendorsCount}</Typography>
      </Box>
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <Box
        sx={{
          padding: 2,
          backgroundColor: '#3F51B5',
          height: { xs: '120px', md: '150px' },
          alignContent: 'center',
          color: '#FFFFFF',
          borderRadius: 2,
          boxShadow: 3,
          textAlign: 'center',
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': { transform: 'scale(1.05)', boxShadow: 6 },
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 300 }}>Total Amount:</Typography>
        <Typography variant="h4" sx={{ fontWeight: 400 }}> ₹{finalamount}</Typography>
      </Box>
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <Box
        sx={{
          padding: 2,
          backgroundColor: '#1e736a',
          height: { xs: '120px', md: '150px' },
          alignContent: 'center',
          color: '#FFFFFF',
          borderRadius: 2,
          boxShadow: 3,
          textAlign: 'center',
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': { transform: 'scale(1.05)', boxShadow: 6 },
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 300 }}>Transaction</Typography>
        <Typography variant="body1" sx={{ fontWeight: 400, textAlign: "left" }}>From Customers: <strong>₹{totalCustomerEstimate}</strong></Typography><br />
        <Typography variant="body1" sx={{ fontWeight: 400, textAlign: "left" }}>To Vendors: <strong>₹{totalVendorEstimate}</strong></Typography>
      </Box>
    </Grid>

    {/* Pending Customers Dialog */}
      <Dialog open={openPendingCustomerDialog} onClose={() => setOpenPendingCustomerDialog(false)}>
        <DialogTitle>Pending Customers</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingCustomers.slice(customerPage * customerRowsPerPage, customerPage * customerRowsPerPage + customerRowsPerPage).map(customer => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.id}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={pendingCustomers.length}
            rowsPerPage={customerRowsPerPage}
            page={customerPage}
            onPageChange={handleCustomerChangePage}
            onRowsPerPageChange={handleCustomerChangeRowsPerPage}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPendingCustomerDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pending Vendors Dialog */}
      <Dialog open={openPendingVendorDialog} sx={{ width: '100%',padding:10 }} onClose={() => setOpenPendingVendorDialog(false) }>
        <DialogTitle>Pending Vendors</DialogTitle>
        <DialogContent>
          {pendingVendors.length > 0 ? (
            pendingVendors.slice(vendorPage * vendorRowsPerPage, vendorPage * vendorRowsPerPage + vendorRowsPerPage).map(vendor => (
              <Box key={vendor.vendorId} sx={{ marginBottom: 2 }}>
                <Typography variant="h6">{vendor.vendorName} (ID: {vendor.vendorId})</Typography>
                <ul>
                  {vendor.assignedCustomers.length > 0 ? (
                    vendor.assignedCustomers.map(customer => (
                      <li key={customer.id}>(ID:{customer.id}) {customer.name} </li>
                    ))
                  ) : (
                    <li>No assigned customers</li>
                  )}
                </ul>
              </Box>
            ))
          ) : (
            <Typography>No pending vendors found.</Typography>
          )}
        
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPendingVendorDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

  </Grid>

  {/* Chart Section */}
  <Grid container spacing={3} justifyContent="center" sx={{ marginTop: 2 }}>
    <Grid item xs={12} md={8}>
      <Box sx={{
        backgroundColor: "#ffffff",
        borderRadius: 3,
        padding: 3,
        boxShadow: 4,
        width: '100%',
      }}>
        <Typography variant="h6" align="center" sx={{ fontWeight: 600, marginBottom: 2, color: "#333" }}>
          Monthly Transaction Overview
        </Typography>
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <LineChart
            width={window.innerWidth < 600 ? 350 : 700} // Resize chart dynamically
            height={250}
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            <defs>
              <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3f51b5" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#3f51b5" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="colorGiven" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#bb2ee6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#bb2ee6" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 14 }} />
            <YAxis stroke="#666" tick={{ fontSize: 14 }} />
            <Legend wrapperStyle={{ fontSize: "14px" }} />
            <Line
              type="monotone"
              dataKey="received"
              stroke="url(#colorReceived)"
              strokeWidth={5}
              dot={false}
              style={{ filter: "drop-shadow(0px 3px 6px rgba(76, 175, 80, 0.5))" }}
            />
            <Line
              type="monotone"
              dataKey="given"
              stroke="url(#colorGiven)"
              strokeWidth={5}
              dot={false}
              style={{ filter: "drop-shadow(0px 3px 6px rgba(244, 67, 54, 0.5))" }}
            />
          </LineChart>
        </Box>
      </Box>
    </Grid>
  </Grid>
</Grid>


      <Box sx={{ marginTop: 3, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2, }}>
          <TextField
            label="Search by Phone Number"
            value={search}
            onChange={handleSearch}
            sx={{ width: '40%', borderRadius: 20 }} // Add border radius here
            margin="normal"
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
          <IconButton onClick={handleFilterClick}>
            <FilterListIcon />
          </IconButton>
          <Typography variant="body1" sx={{ marginLeft: 2, fontWeight: 400, color: 'gray' }}>
            ( {count} )
          </Typography>
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterClose}
          >
            <MenuItem onClick={() => handleFilterSelect('all')}>All Time</MenuItem>
            <MenuItem onClick={() => handleFilterSelect('yesterday')}>Yesterday</MenuItem>
            <MenuItem onClick={() => handleFilterSelect('lastWeek')}>Last Week</MenuItem>
            <MenuItem onClick={() => handleFilterSelect('lastMonth')}>Last Month</MenuItem>
          </Menu>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Email</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Phone</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Product</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Serial No.</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCustomers.map(customer => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.id}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{customer.email}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{customer.phone}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{customer.product_name}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{customer.serialnumber}</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleViewCustomer(customer)}
                      variant="contained"
                      color="primary"
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]} // Options for rows per page
            component="div"
            count={sortedCustomers.length} // Total number of rows
            rowsPerPage={rowsPerPage} // Current rows per page
            page={page} // Current page
            onPageChange={handleChangePage} // Function to handle page change
            onRowsPerPageChange={handleChangeRowsPerPage} // Function to handle rows per page change
          />
        </TableContainer>
      </Box>

      {/* Customer Details Modal */}
      <Dialog open={openCustomerDetails} onClose={handleCloseCustomerDetails}>
        <DialogTitle>Customer Details</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <>
              <Typography variant="h6">Name: {selectedCustomer.name}</Typography>
              <Typography>Email: {selectedCustomer.email}</Typography>
              <Typography>Phone: {selectedCustomer.phone}</Typography>
              <Typography>Product Name: {selectedCustomer.product_name}</Typography>
              <Typography>Serial Number: {selectedCustomer.serialnumber}</Typography>
              <Typography>Problem: {selectedCustomer.problem}</Typography>
              <Typography>Received Date: {selectedCustomer.received_date}</Typography>
              <Typography>Delivered Date: {selectedCustomer.delivered_date || 'Not Delivered Yet'}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCustomerDetails} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
