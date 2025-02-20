import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem } from "@mui/material"; // Import necessary components
import DownloadIcon from '@mui/icons-material/Download'; // Import the Download icon
import { useTheme, useMediaQuery } from "@mui/material"; // Import useTheme and useMediaQuery

const ExportButton = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Check if the screen is mobile size
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [openDialog, setOpenDialog] = useState(false); // State to control the dialog
  const [customers, setCustomers] = useState([]); // State to hold all customers
  const [role, setRole] = useState(localStorage.getItem("role")); // Get user role from local storage

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/companies"); // Replace with your actual endpoint
        setCompanies(response.data);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    fetchCompanies();
  }, []);

  const handleExport = async () => {
    try {
      const companyId = localStorage.getItem("company_id"); // Replace with your actual logic to get company ID
  
      // Fetch all customer data from the backend
      const response = await axios.get("http://localhost:5000/api/customers", {
        headers: {
          company: companyId, // Include company ID in headers
          role: role, // Include role in headers
        },
        withCredentials: true, // Include credentials (cookies) with the request
      });
  
      setCustomers(response.data); // Store all customers in state

      // Check if the user is an admin
      if (role === "admin") {
        setOpenDialog(true); // Open the dialog for company selection
      } else {
        // Directly export for regular users
        exportToCSV(response.data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error.response ? error.response.data : error.message);
      alert("Failed to fetch customer data!");
    }
  };

  const handleCompanySelect = () => {
    let filteredCustomers;

    if (selectedCompany === "all") {
      // If "All Companies" is selected, use all customers
      filteredCustomers = customers;
    } else {
      // Filter customers based on the selected company
      filteredCustomers = customers.filter(customer => customer.company_id === selectedCompany);
    }

    if (filteredCustomers.length === 0) {
      alert("No customers found for the selected company!");
      return;
    }

    // Proceed to export the filtered customers
    exportToCSV(filteredCustomers);
    setOpenDialog(false); // Close the dialog after exporting
  };

  const exportToCSV = (customers) => {
    // Define CSV Headers
    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Product Name",
      "Serial Number",
      "Problem",
      "Received Date",
      "Delivered Date",
      "Estimate",
      "Checkbox 1",
      "Checkbox 2",
      "Checkbox 3",
      "Checkbox 4",
      "Checkbox 5",
    ];

    // Convert Data to CSV Format
    const csvRows = [headers.join(",")]; // Add header row

    customers.forEach((customer) => {
      const row = [
        customer.id,
        customer.name,
        customer.email,
        customer.phone,
        customer.product_name,
        customer.serialnumber,
        customer.problem,
        customer.received_date || "",
        customer.delivered_date || "",
        customer.estimate || "",
        customer.checkbox1 ? "Yes" : "No",
        customer.checkbox2 ? "Yes" : "No",
        customer.checkbox3 ? "Yes" : "No",
        customer.checkbox4 ? "Yes" : "No",
        customer.checkbox5 ? "Yes" : "No",
      ];
      csvRows.push(row.join(",")); // Add each row
    });

    // Convert Array to CSV String
    const csvString = csvRows.join("\n");
    
    // Create Blob and Download
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "customers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<DownloadIcon />} // Add the icon here
        onClick={handleExport}
      >
        {!isMobile && "Export Customers"} {/* Show text only if not on mobile */}
      </Button>

      {/* Dialog for Company Selection */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Select Company</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel id="company-select-label">Company</InputLabel>
            <Select
              labelId="company-select-label"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            >
              <MenuItem value="all">All Companies</MenuItem> {/* Option for all companies */}
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleCompanySelect} color="primary">
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExportButton;