
  import React, { useState, useEffect } from 'react';
  import { Button, TextField, Box, Table, IconButton,InputAdornment,FormControl,MenuItem,InputLabel,Select,TableBody,Typography ,TablePagination ,TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogActions, DialogContent, DialogTitle, Checkbox, FormControlLabel } from '@mui/material';
  import axios from 'axios';
  import jsPDF from 'jspdf';
  import ExportButton from './Exportbutton';
  import { slice } from 'lodash';
  import SearchIcon from '@mui/icons-material/Search';
  import AddIcon from '@mui/icons-material/Add';
  import { useTheme } from '@mui/material/styles';
  import { useMediaQuery } from '@mui/material';
  import CompanyLogo from './Logo';
  import FilterListIcon from '@mui/icons-material/FilterList';
  const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState('');
    const [openAddCustomer, setOpenAddCustomer] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
      name: '',
      email: '',
      phone: '',
      product_name: '',
      serialnumber: '',
      problem: '',
      received_date: '',
      delivered_date: '',
      remark: '',
      checkboxes: {
        checkbox1: false,
        checkbox2: false,
        checkbox3: false,
        checkbox4: false,
        checkbox5: false,
        checkbox6: false,
      },
    });
    const [openCustomerDetails, setOpenCustomerDetails] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [estimates, setEstimates] = useState([]);
    const [vendorName, setVendorName] = useState(null);
    const [pageNumber, setPageNumber] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterCustomers, setFilterCustomers] = useState([]);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Check if the screen is mobile size


    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const role = localStorage.getItem("role"); // Assuming role is stored in localStorage
 // console.log(role);

    useEffect(() => {
      const fetchCustomers = async () => {
          const companyId = localStorage.getItem("company_id");
          const role = localStorage.getItem("role");
          //console.log(companyId);
  
          try {
              const response = await axios.get('https://ledger-flow-backend.vercel.app/api/customers', {
                  headers: {
                      'company': companyId, // Send company_id in headers
                      'role': role // Corrected header name
                  },
                  withCredentials: true, // Include credentials for session management
              });
  
              setCustomers(response.data);
              setFilterCustomers(response.data); // Initialize filtered customers

          } catch (error) {
              console.error("Error fetching customers:", error);
          }
      };
  
      const fetchVendors = async () => {
          try {
              const response = await axios.get('https://ledger-flow-backend.vercel.app/api/vendors');
              const transformedVendors = response.data.map(vendor => ({
                  id: vendor[0], // Assuming the first element is the ID
                  name: vendor[1], // Assuming the second element is the name
                  estimate: vendor[2] // Assuming the third element is the estimate
              }));
              setVendors(transformedVendors);
          } catch (error) {
              console.error("Error fetching vendors:", error);
          }
      };
  
      const fetchCompanies = async () => {
        try {
          const response = await axios.get('https://ledger-flow-backend.vercel.app/api/companies');
          //console.log("Fetched Companies:", response.data); // Log the fetched companies

          setCompanies(response.data);
        } catch (error) {
          console.error("Error fetching companies:", error);
        }
      };
  
      fetchCustomers();
      fetchVendors();
      fetchCompanies();
    }, [role]);

    const handleSearch = (event) => {
      setSearch(event.target.value);
      filterCustomer(event.target.value, selectedCompany);
    };
    const filterCustomer = (searchTerm, companyId) => {
      const filtered = customers.filter(customer => {
        const matchesSearch = customer?.id?.toString()?.includes(search.toLowerCase()) ||
                              customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              customer.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCompany = companyId ? customer.company_id === companyId : true; // Filter by company if selected
        return matchesSearch && matchesCompany;
      });
      //console.log("Filtered Customers:", filtered); // Log the filtered customers
      setFilterCustomers(filtered);
    };


    const handleCompanyChange = (event) => {
      setSelectedCompany(event.target.value);
      filterCustomer(search, event.target.value);
    };




    const handleAddCustomer = () => {
      setOpenAddCustomer(true);
    };

    const handleCloseAddCustomer = () => {
      setOpenAddCustomer(false);
    };

    const handleAddCustomerSubmit = async () => {
      const companyId = selectedCompany || localStorage.getItem("company_id");
    
      try {
        await axios.post("https://ledger-flow-backend.vercel.app/api/add-customer", newCustomer, {
          headers: {
            company: companyId,
            role: role,
          },
        });
    
        setCustomers([...customers, newCustomer]);
        setOpenAddCustomer(false);
    
        // Fetch company logo based on companyId
        axios
          .get(`https://ledger-flow-backend.vercel.app/api/company/${companyId}`, {
            responseType: "blob",
          })
          .then((response) => {
            const reader = new FileReader();
            reader.readAsDataURL(response.data);
            reader.onloadend = () => {
              generateAddInvoice(newCustomer, reader.result); // Pass Base64 logo
            };
          })
          .catch((error) => {
            console.error("Error fetching company logo:", error);
            generateAddInvoice(newCustomer, null); // Generate without logo on error
          });
    
        // Reload page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error(error);
      }
    };
    

    const handleInputChange = (event) => {
      const { name, value } = event.target;
      setNewCustomer({
        ...newCustomer,
        [name]: value
      });
    };

    const handleCheckboxChange = (event) => {
      const { name, checked } = event.target;
      setNewCustomer({
        ...newCustomer,
        checkboxes: {
          ...newCustomer.checkboxes,
          [name]: checked,
        },
      });
    };
   {/* const filteredCustomers = customers?.filter(customer =>
      customer?.id?.toString()?.includes(search.toLowerCase()) ||
      customer?.name?.toLowerCase()?.includes(search.toLowerCase()) ||
      customer?.email?.toLowerCase()?.includes(search.toLowerCase())
    ) || [];*/}
    const sortedCustomers = [...filterCustomers].sort((a, b) => b.id - a.id);


    const handleViewCustomer = (customer) => {
      const customerVendors = vendors.filter(vendor => (customer.vendor_id !== null ? customer.vendor_id : 0) === vendor.id);

      const customerWithVendors = { ...customer, vendors: customerVendors };
      setSelectedCustomer(customerWithVendors);

      const customerWithCheckboxes = { ...customer, vendors: customerVendors };
      setSelectedCustomer(customerWithCheckboxes);
      setOpenCustomerDetails(true);
    };

    const fetchVendorDetails = async (vendorId) => {
      const response = await fetch(`https://ledger-flow-backend.vercel.app/api/vendors/${vendorId}`);
      const vendorData = await response.json();
      return vendorData;
    };

    useEffect(() => {
      if (selectedCustomer && selectedCustomer.vendor_id != null) {
        fetchVendorDetails(selectedCustomer.vendor_id)
          .then((vendor) => {
            setVendorName(vendor.name);
          });
      } else {
        setVendorName(null); // Reset vendor name if no vendor_id
      }
    }, [selectedCustomer?.vendor_id]);

    const handleCloseCustomerDetails = () => {
      setOpenCustomerDetails(false);
    };

    const handleDeliveredDate = (customerId) => {
      axios.put(`https://ledger-flow-backend.vercel.app/api/update-delivered-date/${customerId}`)
        .then(response => {
          setCustomers(customers.map(customer =>
            customer.id === customerId ? { ...customer, delivered_date: response.data.delivered_date } : customer
          ));
        })
        .catch(error => console.error(error));
      window.location.reload();
    };








    const getNewInvoiceNumber = () => {
      if (customers.length === 0) return 1;  // If no customers exist, start with 1
    
      // Get the max customer id from the list
      const maxId = Math.max(...customers.map(customer => customer.id));
      return maxId + 1;  // Return the new invoice number
    };

    const generateAddInvoice = (selectedCustomer, logoBase64) => {
      if (!selectedCustomer) return;
      const newInvoiceNumber = getNewInvoiceNumber();
    
      const doc = new jsPDF();
      const margin = 15;
      const pageWidth = doc.internal.pageSize.width;
      let yOffset = margin;
    
      doc.setFont("times", "normal");
    
      // *Add Logo Dynamically*
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", margin, yOffset, 40, 20);
        yOffset += 10;
      }
    
      // *Business Information*
      doc.setFontSize(14).setFont("times", "bold");
      doc.text("Microvision", pageWidth - margin, yOffset, { align: "right" });
    
      doc.setFontSize(10).setFont("times", "normal");
      doc.text("Company Address, City, ZIP", pageWidth - margin, yOffset + 5, { align: "right" });
      doc.text("(+123) 456 7890", pageWidth - margin, yOffset + 10, { align: "right" });
      doc.text("email@example.com", pageWidth - margin, yOffset + 15, { align: "right" });
    
      yOffset += 20;
      doc.line(margin, yOffset, pageWidth - margin, yOffset);
      yOffset += 8;
    
      // *Invoice Information*
      doc.setFont("times", "bold").setFontSize(12);
      doc.text(`Inward : ${newInvoiceNumber}`, pageWidth - margin, yOffset, { align: "right" });
    
      doc.setFont("times", "normal").setFontSize(10);
      doc.text(`Inward Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, yOffset + 6, { align: "right" });
      yOffset += 15;
    
      // *Customer Information*
      doc.setFont("times", "bold").text("Customer Information", margin, yOffset);
      yOffset += 6;
      doc.setFont("times", "normal");
      doc.text(`Name: ${selectedCustomer.name}`, margin, yOffset + 6);
      doc.text(`Phone: ${selectedCustomer.phone}`, margin, yOffset + 12);
      doc.text(`Email: ${selectedCustomer.email}`, margin, yOffset + 18);
    
      yOffset += 20;
      doc.line(margin, yOffset, pageWidth - margin, yOffset);
      yOffset += 8;
    
      // *Product Information*
      doc.setFont("times", "bold").text("Product Details", margin, yOffset);
      yOffset += 6;
      doc.line(margin, yOffset, pageWidth - margin, yOffset);
      yOffset += 8;
      doc.setFont("times", "normal");
      doc.text(`Product Name: ${selectedCustomer.product_name}`, margin, yOffset + 6);
      doc.text(`Serial No: ${selectedCustomer.serialnumber}`, margin, yOffset + 12);
      doc.text(`Problem: ${selectedCustomer.problem}`, margin, yOffset + 18);
      doc.text(`Received Date: ${selectedCustomer.received_date}`, margin, yOffset + 24);
      yOffset += 40;
      doc.line(margin, yOffset, pageWidth - margin, yOffset);
      yOffset += 8;
     // Terms & Conditions
     yOffset += 15;
     doc.setFont("times", "bold").text("Terms & Conditions", margin, yOffset);
     yOffset += 6;
     doc.setFont("times", "normal").setFontSize(9);
     const terms = [
         "1. The invoice must be paid in full before the product is delivered.",
         "2. The company is not responsible for data loss during repair.",
         "3. Any service warranty is limited to the parts replaced only.",
         "4. No refunds will be provided once the repair service is completed.",
         "5. Customers are responsible for collecting their devices within 30 days.",
     ];

     terms.forEach((term, index) => {
         doc.text(term, margin, yOffset + index * 6);
     });

     yOffset += terms.length * 6 + 10;

     // Footer
     doc.setFont("times", "italic");
     doc.text("Thank you for your business!", pageWidth / 2, yOffset, { align: "center" });

     yOffset += 10;
     doc.text("Authorized Signature: ______________________", margin + 5, yOffset);
     doc.text("Customer Signature: ______________________", pageWidth - margin - 80, yOffset);
      // *Save the PDF*
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank'); // Open in new tab
      // doc.save(`Inward_${newInvoiceNumber}.pdf`);
    };
    
    










    const generateInvoice = (logoUrl) => {
     // console.log("Generate Invoice function called");
     // console.log("Selected Customer:", selectedCustomer);
  
      if (!selectedCustomer) {
          console.log("No customer selected for invoice generation.");
          return;
      }
  
      const doc = new jsPDF();
      const margin = 15;
      const pageWidth = doc.internal.pageSize.width;
      let yOffset = margin;
  
      doc.setFont("times", "normal");
  
      // Function to Convert Blob URL to Base64
      const convertToBase64 = (blobUrl, callback) => {
          fetch(blobUrl)
              .then(response => response.blob())
              .then(blob => {
                  const reader = new FileReader();
                  reader.onloadend = () => callback(reader.result);
                  reader.readAsDataURL(blob);
              })
              .catch(error => {
                  console.error("Error converting logo to Base64:", error);
                  callback(null);
              });
      };
  
      // Convert logo URL to Base64 and generate PDF
      convertToBase64(logoUrl, (base64Image) => {
          if (base64Image) {
              doc.addImage(base64Image, "PNG", margin, yOffset, 40, 20);
              yOffset += 10;
          }
  
          // Business Information
          doc.setFontSize(14).setFont("times", "bold");
          doc.text("Microvision", pageWidth - margin, yOffset, { align: "right" });
  
          doc.setFontSize(10).setFont("times", "normal");
          doc.text("Albania, Tirane ish-Dogana, Durres 2001", pageWidth - margin, yOffset + 5, { align: "right" });
          doc.text("(+355) 069 11 11 111", pageWidth - margin, yOffset + 10, { align: "right" });
          doc.text("email@example.com", pageWidth - margin, yOffset + 15, { align: "right" });
  
          yOffset += 20;
          doc.line(margin, yOffset, pageWidth - margin, yOffset); // Divider
          yOffset += 8;
  
          // Invoice Information
          doc.setFont("times", "bold").setFontSize(12);
          doc.text(`Outward : ${selectedCustomer.id}`, pageWidth - margin, yOffset, { align: "right" });
  
          doc.setFont("times", "normal").setFontSize(10);
          doc.text(`Outward Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, yOffset + 6, { align: "right" });
          doc.text(`Payment Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, yOffset + 12, { align: "right" });
  
          yOffset += 15;
  
          // Customer Information
          doc.setFont("times", "bold").text("Customer Information", margin, yOffset);
          yOffset += 6;
          doc.setFont("times", "normal");
          doc.text(`Name: ${selectedCustomer.name}`, margin, yOffset + 6);
          doc.text(`Phone: ${selectedCustomer.phone}`, margin, yOffset + 12);
          doc.text(`Email: ${selectedCustomer.email}`, margin, yOffset + 18);
  
          yOffset += 20;
          doc.line(margin, yOffset, pageWidth - margin, yOffset); // Divider
          yOffset += 8;
  
          // Product Information
          doc.setFont("times", "bold").text("Product Details", margin, yOffset);
          yOffset += 6;
          doc.line(margin, yOffset, pageWidth - margin, yOffset);
          yOffset += 8;
          doc.setFont("times", "normal");
          doc.text(`Product Name: ${selectedCustomer.product_name}`, margin, yOffset + 6);
          doc.text(`Serial No: ${selectedCustomer.serialnumber}`, margin, yOffset + 12);
          doc.text(`Problem: ${selectedCustomer.problem}`, margin, yOffset + 18);
          doc.text(`Received Date: ${selectedCustomer.received_date}`, margin, yOffset + 24);
          doc.text(`Delivered Date: ${selectedCustomer.delivered_date || 'Not Delivered Yet'}`, margin, yOffset + 30);
          doc.text(`Remarks: ${selectedCustomer.remark || 'No Remarks'}`, margin, yOffset + 36);
  
          yOffset += 40;
          doc.line(margin, yOffset, pageWidth - margin, yOffset); // Divider
          yOffset += 8;
  
          // Terms & Conditions
          yOffset += 15;
          doc.setFont("times", "bold").text("Terms & Conditions", margin, yOffset);
          yOffset += 6;
          doc.setFont("times", "normal").setFontSize(9);
          const terms = [
              "1. The invoice must be paid in full before the product is delivered.",
              "2. The company is not responsible for data loss during repair.",
              "3. Any service warranty is limited to the parts replaced only.",
              "4. No refunds will be provided once the repair service is completed.",
              "5. Customers are responsible for collecting their devices within 30 days.",
          ];
  
          terms.forEach((term, index) => {
              doc.text(term, margin, yOffset + index * 6);
          });
  
          yOffset += terms.length * 6 + 10;
  
          // Footer
          doc.setFont("times", "italic");
          doc.text("Thank you for your business!", pageWidth / 2, yOffset, { align: "center" });
  
          yOffset += 10;
          doc.text("Authorized Signature: ______________________", margin + 5, yOffset);
          doc.text("Customer Signature: ______________________", pageWidth - margin - 80, yOffset);
  
          // **Ensure PDF is saved after image is added**
          doc.autoPrint();
          window.open(doc.output('bloburl'), '_blank'); // Open in new tab
          //doc.save(`Outward_${selectedCustomer.id}.pdf`);
      });
  };
  

    const handleChangePage = (event, newPage) => {
      setPageNumber(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPageNumber(0);
    };

    const paginatedCustomers = sortedCustomers.slice(pageNumber * rowsPerPage, (pageNumber + 1) * rowsPerPage);














    const [openEditCustomer, setOpenEditCustomer] = useState(false);
    const [editCustomer, setEditCustomer] = useState({
      id: '',
      name: '',
      email: '',
      phone: '',
      product_name: '',
      serialnumber: '',
      problem: '',
      received_date: '',
      remark: '',
      checkboxes: {
        checkbox1: false,
        checkbox2: false,
        checkbox3: false,
        checkbox4: false,
        checkbox5: false,
        checkox6: false,
      },
    });
    
    const handleCloseEditCustomer = () => {
      setOpenEditCustomer(false);
    };
    
    const handleEditInputChange = (event) => {
      const { name, value } = event.target;
      setEditCustomer({
        ...editCustomer,
        [name]: value
      });
    };
    
    const handleEditCheckboxChange = (event) => {
      const { name, checked } = event.target;
      setEditCustomer({
        ...editCustomer,
        checkboxes: {
          ...editCustomer.checkboxes,
          [name]: checked,
        },
      });
    };
    
    const handleEditCustomerSubmit = () => {
      axios.put(`https://ledger-flow-backend.vercel.app/api/update-customers/${editCustomer.id}/update_received_date`, {
        name: editCustomer.name,
        email: editCustomer.email,
        phone: editCustomer.phone,
        product_name: editCustomer.product_name,
        serialnumber: editCustomer.serialnumber,
        problem: editCustomer.problem,
        received_date: editCustomer.received_date
      })
      .then(response => {
        setCustomers(customers.map(customer =>
          customer.id === editCustomer.id ? { ...customer, ...editCustomer } : customer
        ));
        setOpenEditCustomer(false);
      })
      .catch(error => console.error("Error updating customer:", error));
    };
    

    

    const getVendorNameById = (vendorId) => {
      //console.log("Checking vendor ID:", vendorId); // Log the vendorId being checked
      const vendor = vendors.find(v => v.id === parseInt(vendorId, 10)); // Convert vendorId to an integer
      //console.log("Found Vendor:", vendor); // Log the found vendor

      return vendor ? vendor.name : 'Unknown Vendor';
    };
    
    return (
      <Box>



  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
  <Button 
          variant="contained" 
          color="primary" 
          onClick={handleAddCustomer}
          startIcon={<AddIcon />}

          sx={{ marginLeft: 2 }} // Add margin to the left for spacing
        >
        {!isMobile && "Add Customer"} {/* Show text only if not on mobile */}
        </Button>
        <TextField
          label="Search by Id/Name/Email"
          value={search}
          onChange={handleSearch}
          sx={{ width: '25%', borderRadius: 2 }} // Add border radius here
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
        <FormControl sx={{ minWidth: 100, marginLeft: 2,borderRadius: 2 ,marginRight: 2}}>
          <Select
            value={selectedCompany}
            onChange={handleCompanyChange}
            displayEmpty
            startAdornment={
              <InputAdornment position="start">
                <FilterListIcon /> {/* Add the filter icon here */}
              </InputAdornment>
            }
            sx={{ paddingLeft: '10px' }} // Add padding to avoid overlap with the icon
          >
            <MenuItem value="">
              <em>All Companies</em>
            </MenuItem>
            {companies.map(company => (
              <MenuItem key={company.id} value={company.id}>
                {company.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
       
        <ExportButton />
      </Box>

        {/* Add Customer Modal */}
        <Dialog open={openAddCustomer} onClose={handleCloseAddCustomer}>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogContent>

            <TextField
              label="Name"
              name="name"
              value={newCustomer.name}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Email"
              name="email"
              value={newCustomer.email}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Phone"
              name="phone"
              value={newCustomer.phone}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Product Name"
              name="product_name"
              value={newCustomer.product_name}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Serial Number"
              name="serialnumber"
              value={newCustomer.serialnumber}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Problem"
              name="problem"
              value={newCustomer.problem}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Received Date"
              name="received_date"
              type="date"
              value={newCustomer.received_date}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />
              {role === "admin" && (
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Company</InputLabel>
              <Select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                required
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

            {/* Add Checkboxes */}
            <p>Condition:</p>
            <FormControlLabel
              control={<Checkbox checked={newCustomer.checkboxes.checkbox1} onChange={handleCheckboxChange} name="checkbox1" />}
              label="Body"
            />
            <FormControlLabel
              control={<Checkbox checked={newCustomer.checkboxes.checkbox2} onChange={handleCheckboxChange} name="checkbox2" />}
              label="Keyboard"
            />
            <FormControlLabel
              control={<Checkbox checked={newCustomer.checkboxes.checkbox3} onChange={handleCheckboxChange} name="checkbox3" />}
              label="Screen"
            />
            <FormControlLabel
              control={<Checkbox checked={newCustomer.checkboxes.checkbox4} onChange={handleCheckboxChange} name="checkbox4" />}
              label="Battery"
            />
            <FormControlLabel
              control={<Checkbox checked={newCustomer.checkboxes.checkbox5} onChange={handleCheckboxChange} name="checkbox5" />}
              label="No Condition"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddCustomer} color="primary">
              Cancel
            </Button>
            <Button onClick={handleAddCustomerSubmit} color="primary">
              Submit
            </Button>
          </DialogActions>
        </Dialog>

        {/* Customer Details Modal */}
  <Dialog open={openCustomerDetails} onClose={handleCloseCustomerDetails}>
    <DialogTitle>Customer Details</DialogTitle>
    <DialogContent>

      <p><strong>Name:</strong> {selectedCustomer?.name}</p>
      <p><strong>Email:</strong> {selectedCustomer?.email}</p>
      <p><strong>Phone:</strong> {selectedCustomer?.phone}</p>
      <p><strong>Product:</strong> {selectedCustomer?.product_name}</p>
      <p><strong>Serial Number:</strong> {selectedCustomer?.serialnumber}</p>
      <p><strong>Problem:</strong> {selectedCustomer?.problem}</p>

      <p><strong>Received Date:</strong> {selectedCustomer?.received_date}</p>
      <p><strong>Delivered Date:</strong> {selectedCustomer?.delivered_date || 'Not Delivered Yet'}</p>
      <p><strong>Remarks :</strong> {selectedCustomer?.remark || 'No Remarks'}</p>

      
   
      <p><strong>Vendor Assigned: </strong>
  {vendorName ? (
    <div>
      <span>
        Vendor Assigned: {selectedCustomer.vendor_id} - {vendorName}
      </span><br />
      <span>
        Previous vendors: {(() => {
          // Check if history is a string and parse it
          let historyArray = Array.isArray(selectedCustomer.history) ? selectedCustomer.history : [];
          if (typeof selectedCustomer.history === 'string') {
            try {
              historyArray = JSON.parse(selectedCustomer.history);
            } catch (error) {
              console.error("Error parsing history:", error);
              historyArray = []; // Reset to empty array if parsing fails
            }
          }

          // Map over the history array to display vendor names and estimates
          return historyArray.length > 0 ? (
            historyArray.map((entry, index) => (
              <span key={index}>
                {getVendorNameById(entry.vendor_id)} ({entry.vendor_estimate}){index < historyArray.length - 1 ? ', ' : ''}
              </span>
            ))
          ) : (
            <span>No previous vendors</span>
          );
        })()}
      </span>
    </div>
  ) : (
    <span>No vendor assigned yet.</span>
  )}
</p>

      <p><strong>Estimate Amount:</strong> {selectedCustomer?.estimate || "No estimate available"}</p>
      <p><strong>Current Vendor Estimate Amount:</strong> {selectedCustomer?.vendor_estimate || "No estimate available"}</p>


      <h4>Condition: </h4>
      {['Body', 'Keyboard', 'Screen', 'Battery', 'No Condition','Checked by Engineer'].map((label, index) => (
        <FormControlLabel
          key={index}
          control={<Checkbox checked={selectedCustomer?.[`checkbox${index + 1}`] || false} disabled />}
          label={label}
        />
      ))}
      <br></br>
      <Button
        onClick={() => handleDeliveredDate(selectedCustomer.id)}
        color="primary"
        variant="contained"
        sx={{ marginRight: 2 }}
      >
        Mark as Delivered
      </Button>

      <Button
        onClick={() => {
          setOpenEditCustomer(true);
          setEditCustomer({
            id: selectedCustomer.id,
            name: selectedCustomer.name,
            email: selectedCustomer.email,
            phone: selectedCustomer.phone,
            product_name: selectedCustomer.product_name,
            serialnumber: selectedCustomer.serialnumber,
            problem: selectedCustomer.problem,
            received_date: selectedCustomer.received_date,
            checkboxes: {
              checkbox1: selectedCustomer.checkbox1,
              checkbox2: selectedCustomer.checkbox2,
              checkbox3: selectedCustomer.checkbox3,
              checkbox4: selectedCustomer.checkbox4,
              checkbox5: selectedCustomer.checkbox5,
            },
            
          });
        }}
        color="primary"
        variant="contained"
        disabled={role !== 'admin'} // Disable the button if the user is not an admin
      >
        Edit Customer
      </Button>
    
    </DialogContent>
    <DialogActions>
    <Button
  onClick={() => {
    const companyId = selectedCustomer.company_id;
    if (companyId) {
      axios.get(`https://ledger-flow-backend.vercel.app/api/company/${companyId}`, { responseType: "blob" })
        .then(response => {
          const url = URL.createObjectURL(response.data);
          generateInvoice(url); // Pass the logo URL to generateInvoice
        })
        .catch(error => {
          console.error("Error fetching company logo:", error);
          generateInvoice(null); // Generate invoice without a logo if error occurs
        });
    } else {
      generateInvoice(null); // Generate invoice without a logo if no company ID is found
    }
  }}
  color="primary"
>
  Generate Outward
</Button>

      <Button onClick={handleCloseCustomerDetails} color="secondary">
        Close
      </Button>
    </DialogActions>
  </Dialog>

  <Dialog open={openEditCustomer} onClose={handleCloseEditCustomer}>
    <DialogTitle>Edit Customer</DialogTitle>
    <DialogContent>

      <TextField
        label="Name"
        name="name"
        value={editCustomer.name}
        onChange={handleEditInputChange}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Email"
        name="email"
        value={editCustomer.email}
        onChange={handleEditInputChange}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Phone"
        name="phone"
        value={editCustomer.phone}
        onChange={handleEditInputChange}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Product Name"
        name="product_name"
        value={editCustomer.product_name}
        onChange={handleEditInputChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Serial Number"
        name="serialnumber"
        value={editCustomer.serialnumber}
        onChange={handleEditInputChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Problem"
        name="problem"
        value={editCustomer.problem}
        onChange={handleEditInputChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Received Date"
        name="received_date"
        type="date"
        value={editCustomer.received_date}
        onChange={handleEditInputChange}
        fullWidth
        margin="normal"
        InputLabelProps={{
          shrink: true,
        }}
      />

      {/* Add Checkboxes */}
      <FormControlLabel
        control={<Checkbox checked={editCustomer.checkboxes.checkbox1} onChange={handleEditCheckboxChange} name="checkbox1" />}
        label="Body"
      />
      <FormControlLabel
        control={<Checkbox checked={editCustomer.checkboxes.checkbox2} onChange={handleEditCheckboxChange} name="checkbox2" />}
        label="Keyboard"
      />
      <FormControlLabel
        control={<Checkbox checked={editCustomer.checkboxes.checkbox3} onChange={handleEditCheckboxChange} name="checkbox3" />}
        label="Screen"
      />
      <FormControlLabel
        control={<Checkbox checked={editCustomer.checkboxes.checkbox4} onChange={handleEditCheckboxChange} name="checkbox4" />}
        label="Battery"
      />
      <FormControlLabel
        control={<Checkbox checked={editCustomer.checkboxes.checkbox5} onChange={handleEditCheckboxChange} name="checkbox5" />}
        label="No Condition"
      />



    </DialogContent>
    <DialogActions>
      <Button onClick={handleEditCustomerSubmit} color="primary">
        Submit
      </Button>
      <Button onClick={handleCloseEditCustomer} color="primary">
        Cancel
      </Button>
    </DialogActions>
  </Dialog>

        {/* Customer List */}
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
                <TableCell>Company</TableCell>

                <TableCell >Action</TableCell>
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
                  <TableCell>{companies.find(company => company.id === customer.company_id)?.name || 'N/A'}</TableCell>

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
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filterCustomers.length}
          rowsPerPage={rowsPerPage}
          page={pageNumber}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    );
  };

  export default Customers;
