
import React, { useState, useEffect } from 'react';
import { Button,InputAdornment, CircularProgress,TextField, Box, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Modal, Typography, MenuItem, TablePagination } from '@mui/material';
import axios from 'axios';
import jsPDF from 'jspdf';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { set } from 'lodash';
import EditIcon from '@mui/icons-material/Edit';

  
const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchVendors, setSearchVendors] = useState('');
  const [searchCustomers, setSearchCustomers] = useState('');
  const [openAddVendor, setOpenAddVendor] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: '' });
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [viewCustomers, setViewCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [vendorPage, setVendorPage] = useState(0);
  const [vendorRowsPerPage, setVendorRowsPerPage] = useState(5);
  const [openReceivedDialog, setOpenReceivedDialog] = useState(false);
  const [remark, setRemark] = useState('');
  const [checkbox6, setCheckbox6] = useState(false);
  const [vendorEstimate, setVendorEstimate] = useState('');
  const [currentCustomerId, setCurrentCustomerId] = useState(null);
  const [customerProblem, setCustomerProblem] = useState('');
  const [selectedVendorTotal, setSelectedVendorTotal] = useState(0);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // State to track if editing
  const [newTotal, setNewTotal] = useState(0); // State to hold the new total

const role = localStorage.getItem("role");
const [logoUrl, setLogoUrl] = useState('');


  // Fetch vendors and customers on component mount
  useEffect(() => {
    const companyId = localStorage.getItem("company_id");
    const role = localStorage.getItem("role");
    axios.get('http://localhost:5000/api/vendors')
      .then(response => {
        const formattedVendors = response.data.map((vendor) => ({
          id: vendor[0],   // First element is ID
          name: vendor[1],  // Second element is Name
          total: vendor[2] // Third element is Total
        }));
        setVendors(formattedVendors);
      })
      .catch(error => console.error('Error fetching vendors:', error));

    axios.get('http://localhost:5000/api/customers',
      
       { headers: {
          'company': companyId,
          'role':role
      }}
    )  // Assuming you have a `/api/customers` route to fetch customers
      .then(response => {
        setCustomers(response.data);
      })
      .catch(error => console.error('Error fetching customers:', error));
  }, []);

  // Handle search input change for vendors
  const handleSearchVendors = (event) => {
    setSearchVendors(event.target.value);
  };

  // Handle search input change for customers
  const handleSearchCustomers = (event) => {
    setSearchCustomers(event.target.value);
  };

  // Filter vendors based on search term
  const filteredVendors = vendors.filter(vendor =>
    searchVendors.trim() === '' || // Check if search term is empty
    vendor.name && vendor.name.toLowerCase().includes(searchVendors.toLowerCase()) ||
    vendor.id.toString().includes(searchVendors.toLowerCase())
  );
  
  // Filter customers based on search term
  const filteredCustomers = viewCustomers.filter((customer) => 
    searchCustomers.trim() === '' || // Check if search term is empty
    customer.id.toString().includes(searchCustomers.toLowerCase()) ||
    customer.name.toLowerCase().includes(searchCustomers.toLowerCase())
  );

  // Open modal for adding vendor
  const handleAddVendor = () => {
    setOpenAddVendor(true);
  };

  // Close modal without making changes
  const handleCloseAddVendor = () => {
    setOpenAddVendor(false);
  };

  // Handle form submission for adding new vendor
  const handleAddVendorSubmit = () => {
    if (newVendor.name) {
      axios.post('http://localhost:5000/api/add-vendor', newVendor)
        .then(response => {
          setVendors([...vendors, response.data]); // Adding newly added vendor to the state
          setOpenAddVendor(false); // Closing modal
          setNewVendor({ name: '' }); // Resetting the form input
        })
        .catch(error => console.error('Error adding vendor:', error));
    } else {
      alert('Please enter a vendor name.');
    }
  };

  // Assign customer to vendor
  const handleAssignCustomer = async () => {
    if (selectedCustomer && selectedVendor) {
        const customer = customers.find(cust => cust.id === selectedCustomer);
        
        if (!customer) {
            alert("Customer not found!");
            return;
        }

        if (customer.vendor_id) {
            const assignedVendor = vendors.find(vendor => vendor.id === customer.vendor_id);
            const confirmMessage = `This customer is already assigned to ${assignedVendor.name}. Are you sure you want to reassign?`;

            if (!window.confirm(confirmMessage)) return;
        }

        const data = {
            customer_id: selectedCustomer,
            vendor_id: selectedVendor,
            old_vendor_id: customer.vendor_id || null,
            old_vendor_estimate: customer.vendor_estimate || null
        };

        try {
            const response = await axios.post('http://localhost:5000/api/vendors/assign_customer', data);
            alert(response.data.message);

            const newVendor = vendors.find(vendor => vendor.id === selectedVendor);
            
            // Fetch the logo and generate the invoice
            const logo = await fetchLogo(selectedCustomer);
            generateInvoicePDF(customer, newVendor, logo);

            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Error assigning customer:', error);
            alert('Error assigning customer to vendor.');
        }
    } else {
        alert('Please select both a customer and a vendor.');
    }
};

const fetchLogo = async (customerId) => {
  try {
      const customer = customers.find(cust => cust.id === customerId);
      if (!customer) {
          console.error("Customer not found for fetching logo.");
          return null;
      }

      console.log("Fetching logo for customer:", customerId);
      const response = await axios.get(`http://localhost:5000/api/company/${customer.company_id}`, {
          responseType: 'blob'
      });

      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(response.data);
          reader.onloadend = () => resolve(reader.result);
      });
  } catch (error) {
      console.error("Error fetching logo:", error);
      return null;
  }
};


const generateInvoicePDF = async (customer, previousVendor, logo) => {
  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.width;
  let yOffset = margin;

  doc.setFont("times", "normal");

  if (logo) {
      doc.addImage(logo, "PNG", margin, yOffset, 40, 20);
      yOffset += 30;
  } else {
      console.warn("Logo URL not available");
  }

  doc.setFontSize(14).setFont("times", "bold");
  doc.text("Vendor Outward", pageWidth - margin, yOffset, { align: "right" });
  doc.setFontSize(10).setFont("times", "normal");
  doc.text(
      `Vendor Assigned: ${previousVendor ? previousVendor.name : "New Vendor"}`,
      pageWidth - margin,
      yOffset + 6,
      { align: "right" }
  );

  yOffset += 20;
  doc.line(margin, yOffset, pageWidth - margin, yOffset);
  yOffset += 8;

  doc.setFont("times", "bold").text("Customer Information", margin, yOffset);
  yOffset += 6;
  doc.setFont("times", "normal");
  doc.text(`Device Name: ${customer.product_name}`, margin, yOffset + 6);
  doc.text(`Serial Number: ${customer.serialnumber}`, margin, yOffset + 12);
  doc.text(`Device Problem: ${customer.problem}`, margin, yOffset + 18);
  doc.text(`Assigned Date: ${new Date().toLocaleDateString()}`, margin, yOffset + 24);
  yOffset += 30;
  doc.line(margin, yOffset, pageWidth - margin, yOffset);
  yOffset += 8;

  const checkboxLabels = ["Body", "Keyboard", "Screen", "Battery", "No Condition"];
  doc.setFont("times", "bold").text("Device Condition", margin, yOffset);
  yOffset += 6;
  doc.line(margin, yOffset, pageWidth - margin, yOffset);
  yOffset += 8;

  let col1X = margin + 5;
  let col2X = pageWidth / 2 + 5;
  let conditionY = yOffset;
  doc.setFont("times", "normal");

  checkboxLabels.forEach((label, index) => {
      const checkboxKey = `checkbox${index + 1}`;
      const isChecked = customer[checkboxKey] ? "✔ OK" : "✘ Not OK";
      if (index % 2 === 0) {
          doc.text(`${label}: ${isChecked}`, col1X, conditionY);
      } else {
          doc.text(`${label}: ${isChecked}`, col2X, conditionY);
          conditionY += 6;
      }
  });

  yOffset = conditionY + 12;
  yOffset += 15;
  doc.setFont("times", "bold").text("Terms & Conditions", margin, yOffset);
  yOffset += 6;
  doc.setFont("times", "normal").setFontSize(9);
  const terms = [
      "1. The invoice must be paid in full before the product is delivered.",
      "2. The company is not responsible for data loss during repair.",
      "3. Any service warranty is limited to the parts replaced only.",
      "4. No refunds will be provided once the repair service is completed.",
      "5. Customers are responsible for collecting their devices within 30 days."
  ];
  terms.forEach((term, index) => {
      doc.text(term, margin, yOffset + index * 6);
  });

  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};


  
  

  
  
  
  // View customers assigned to the vendor
  const handleViewCustomers = async (vendorId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/vendors/${vendorId}/customers`,
        {
          headers: {  
            'company': localStorage.getItem("company_id"),
            'role': localStorage.getItem("role")
        }}
      );
      setViewCustomers(response.data);


      const selectedVendor = vendors.find(vendor => vendor.id === vendorId);
      if (selectedVendor) {
        setSelectedVendorTotal(selectedVendor.total);
        setSelectedVendorId(vendorId);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setLoading(false);
    }
  };

  // Delete vendor
  const handleDeleteVendor = async (vendorId) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await axios.delete(`http://localhost:5000/api/vendors/${vendorId}`);
        setVendors(vendors.filter(vendor => vendor.id !== vendorId));
        alert('Vendor deleted successfully');
      } catch (error) {
        console.error('Error deleting vendor:', error);
        alert('Error deleting vendor');
      }
    }
  };
  const handleReceivedDate = (customerId) => {
    // Find the customer by ID
    const customer = viewCustomers.find(cust => cust.id === customerId);
    
    // If the customer is found, set the problem
    if (customer) {
      setCustomerProblem(customer.problem); // Set the customer's problem
    }
  
    setCurrentCustomerId(customerId);
    setOpenReceivedDialog(true);
  };



  const handleReceivedDialogSubmit = () => {
    const receivedDate = new Date().toISOString().split('T')[0]; // Get current date
  
    axios.post(`http://localhost:5000/api/customers/${currentCustomerId}/update_received_date`, {
      received_date: receivedDate,
      remark,
      checkbox6,
      vendor_estimate: vendorEstimate
    })
    .then(response => {
      alert("Received date updated successfully!");
  
      // Update the vendor's total
      const vendor = vendors.find(v => v.id === selectedVendorId);
      if (vendor) {
        const updatedTotal = parseFloat(vendor.total) + parseFloat(vendorEstimate || 0); // Add the vendor estimate to the total
        setVendors(vendors.map(v => 
          v.id === selectedVendorId ? { ...v, total: updatedTotal } : v
        ));
        console.log('Updated total:', updatedTotal);
        // Optionally, send the updated total to the backend
        axios.put(`http://localhost:5000/api/vendors/${selectedVendorId}/update-total`, { total: updatedTotal })
          .then(response => {
            //console.log('Vendor total updated successfully', response.data);
          })
          .catch(error => {
            console.error('Error updating total:', error);
            alert("There was an error updating the total.");
          });
      }
  
      setViewCustomers(viewCustomers.map(customer => 
        customer.id === currentCustomerId ? { ...customer, received_vendor_date: receivedDate } : customer
      ));
      setOpenReceivedDialog(false);
      // Reset fields
      setRemark('');
      setCheckbox6(false);
      setVendorEstimate('');
    })
    .catch(error => {
      console.error("Error updating received date:", error);
      alert("Failed to update received date.");
    });
  };





  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleVendorPageChange = (event, newPage) => {
    setVendorPage(newPage);
  };

  const handleVendorRowsPerPageChange = (event) => {
    setVendorRowsPerPage(parseInt(event.target.value, 10));
    setVendorPage(0);
  };


  const handleEditVendorTotal = (vendorId) => {
    setSelectedVendor(vendorId);
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setSelectedVendorTotal(vendor.total);
      setNewTotal(vendor.total); // Set the new total to the current total
    }
    setIsEditing(true); // Enable editing
  };
  const handleCancelEdit = () => {
    setIsEditing(false); // Disable editing
    setNewTotal(selectedVendorTotal); // Reset the new total to the current total
  };
  
  const handleSaveTotal = () => {
    if (!isNaN(newTotal) && newTotal >= 0) {
      // Update the vendor's total in the state
      setVendors(vendors.map(vendor => 
        vendor.id === selectedVendorId ? { ...vendor, total: newTotal } : vendor
      ));
      // Send the updated total to the backend (Flask)
      axios.put(`http://localhost:5000/api/vendors/${selectedVendorId}/update-total`, { total: newTotal })
        .then(response => {
          //console.log('Vendor total updated successfully', response.data);
          setIsEditing(false); // Disable editing
        })
        .catch(error => {
          console.error('Error updating total:', error);
          alert("There was an error updating the total.");
        });
    } else {
      alert("Please enter a valid number.");
    }
  };

  return (
    <Box>


    

      {/* Vendor Search Bar */}
  

      {/* Assign Customer to Vendor */}
      <Box 
        sx={{ 
          marginTop: 3, 
          padding: 2, 
          backgroundColor: '#ffffff', 
          borderRadius: 2, 
          boxShadow: 3 
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2E3B55', marginBottom: 2 }}>
          Assign Customer to Vendor
        </Typography>
        
        <TextField
          select
          label="Select Customer"
          value={selectedCustomer}
          
          onChange={(e) => setSelectedCustomer(e.target.value)}
          variant="outlined"
          sx={{ marginTop: 2, borderRadius: 2,width: '30%' ,marginRight: 2}} // Adjust width and margin here
        >
          {customers.map((customer) => (
            <MenuItem key={customer.id} value={customer.id}>
              {customer.id} - {customer.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Select Vendor"
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
          variant="outlined"
          sx={{ marginTop: 2, borderRadius: 2 ,width: '30%'}}
        >
          {vendors.map((vendor) => (
            <MenuItem key={vendor.id} value={vendor.id}>
              {vendor.id} - {vendor.name}
            </MenuItem>
          ))}
        </TextField><br></br>

        <Button 
          variant="contained" 
          color="secondary" 
          onClick={handleAssignCustomer} 
          sx={{ marginTop: 2 }}
        >
          Assign Customer
        </Button>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
  <TextField
    label="Search Vendors"
    value={searchVendors}
    onChange={handleSearchVendors}
    sx={{ width: '30%', borderRadius: 2 }} // Adjust width here
    margin="normal"
    variant="outlined"
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon />
        </InputAdornment>
      ),
    }}
  />
  <Button 
    variant="contained" 
    color="primary" 
    onClick={handleAddVendor} 
    startIcon={<AddIcon />}
    sx={{ marginLeft: 2 }} // Add margin to the left for spacing
  >
    Add Vendor
  </Button>
</Box>


      {/* Add Vendor Modal */}
      <Modal
        open={openAddVendor}
        onClose={handleCloseAddVendor}
        aria-labelledby="add-vendor-modal"
        aria-describedby="modal-to-add-new-vendor"
      >
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 400, bgcolor: 'white', padding: 3, boxShadow: 24, borderRadius: 2
        }}>
          <Typography variant="h6" gutterBottom>
            Add New Vendor
          </Typography>
          <TextField
            label="Vendor Name"
            fullWidth
            value={newVendor.name}
            onChange={(e) => setNewVendor({ name: e.target.value })}
            margin="normal"
          />
          <Button onClick={handleAddVendorSubmit} variant="contained" color="primary" sx={{ marginTop: 2 }}>
            Submit
          </Button>
          <Button onClick={handleCloseAddVendor} variant="outlined" color="secondary" sx={{ marginTop: 2, marginLeft: 2 }}>
            Cancel
          </Button>
        </Box>
      </Modal>

      {/* View Customers Modal */}
      <Modal
  open={viewCustomers.length > 0 || loading}
  onClose={() => setViewCustomers([])}
  aria-labelledby="view-customers-modal"
  aria-describedby="modal-to-view-customers"
>
  <Box sx={{
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: 800, bgcolor: 'white', padding: 3, boxShadow: 24, borderRadius: 2
  }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Assigned Customers
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {isEditing ? (
          <TextField
            value={newTotal}
            onChange={(e) => setNewTotal(e.target.value)}
            type="number"
            size="small"
            sx={{ marginRight: 2, width: '100px' }} // Adjust width as needed
          />
        ) : (
          <Typography variant="h6" gutterBottom sx={{ marginRight: 2 }}>
            Vendor Total Remaining: {selectedVendorTotal}
          </Typography>
        )}
        {isEditing ? (
          <>
          <Button variant="outlined" color="primary" onClick={handleSaveTotal}>
            Save
          </Button>

          <Button variant="outlined" color="secondary" onClick={handleCancelEdit}>
                  Cancel
                </Button>
          </>
        ) : (
          <Button variant="outlined" color="primary" onClick={() => handleEditVendorTotal(selectedVendor)} disabled={role!="admin"}>
            <EditIcon fontSize="small" />
          </Button>
        )}
      </Box>
    </Box>

    {/* Customer Search Bar */}
    <TextField
      label="Search Customers"
      value={searchCustomers}
      onChange={handleSearchCustomers}
      fullWidth
      margin="normal"
    />

    {loading ? (
     <Box
     sx={{
       display: 'flex',
       justifyContent: 'center',
       alignItems: 'center',
       height: '100px', // Adjust height as needed
     }}
   >
     <CircularProgress />
   </Box>
    ) : (
      <TableContainer sx={{ maxHeight: 500, overflowY: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Id</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Problem</TableCell>
              <TableCell>Assigned Date</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Received Back</TableCell>
              <TableCell>Vendor Estimate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {filteredCustomers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} align="center">
              <Typography>No customers assigned.</Typography>
            </TableCell>
          </TableRow>
        ) : (
          filteredCustomers
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.id}</TableCell>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.problem}</TableCell>
                <TableCell>{customer.assigned_date}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ marginLeft: 1 }}
                    onClick={() => handleReceivedDate(customer.id)}
                  >
                    Received
                  </Button>
                </TableCell>
                <TableCell>{customer.received_vendor_date ? customer.received_vendor_date : "Not Received"}</TableCell>
                <TableCell>{customer.vendor_estimate ? customer.vendor_estimate : "- -"}</TableCell>
              </TableRow>
            ))
        )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    )}
    <Button onClick={() => setViewCustomers([])} variant="contained" color="primary" sx={{ marginTop: 2 }}>
      Close
    </Button>
  </Box>
</Modal>

      {/* Vendors Table */}
      <TableContainer component={Paper} sx={{ marginTop: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Id</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVendors
              .slice(vendorPage * vendorRowsPerPage, vendorPage * vendorRowsPerPage + vendorRowsPerPage)
              .map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>{vendor.id}</TableCell>
                  <TableCell>{vendor.name}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleViewCustomers(vendor.id)}
                    >
                      View Customers
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteVendor(vendor.id)}
                      sx={{ marginLeft: 2 }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredVendors.length}
        rowsPerPage={vendorRowsPerPage}
        page={vendorPage}
        onPageChange={handleVendorPageChange}
        onRowsPerPageChange={handleVendorRowsPerPageChange}
      />



<Modal
  open={openReceivedDialog}
  onClose={() => setOpenReceivedDialog(false)}
  aria-labelledby="received-date-dialog"
  aria-describedby="modal-to-enter-received-date-details"
>
  <Box sx={{
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: 400, bgcolor: 'white', padding: 3, boxShadow: 24, borderRadius: 2
  }}>
    <Typography variant="h6" gutterBottom>
      Update Received Date
    </Typography>
    
    {/* Display Customer Problem */}
    <Typography variant="body1" gutterBottom>
      Customer Problem: {customerProblem}
    </Typography>

    <TextField
      label="Remark"
      fullWidth
      value={remark}
      onChange={(e) => setRemark(e.target.value)}
      margin="normal"
    />
    <TextField
      label="Vendor Estimate"
      fullWidth
      value={vendorEstimate}
      onChange={(e) => setVendorEstimate(e.target.value)}
      margin="normal"
    />
    <Box>
      <input
        type="checkbox"
        checked={checkbox6}
        onChange={(e) => setCheckbox6(e.target.checked)}
      />
      <label>Checked by Engineer</label>
    </Box>
    <Button onClick={handleReceivedDialogSubmit} variant="contained" color="primary" sx={{ marginTop: 2 }}>
      Submit
    </Button>
    <Button onClick={() => setOpenReceivedDialog(false)} variant="outlined" color="secondary" sx={{ marginTop: 2, marginLeft: 2 }}>
      Cancel
    </Button>
  </Box>
</Modal>

    </Box>
  );
};

export default Vendors;