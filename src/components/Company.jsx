import React, { useState } from 'react';
import { TextField, Button, Typography, Paper, Snackbar, IconButton, Box, Avatar } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import axios from 'axios';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const CompanyForm = () => {
  const [companyName, setCompanyName] = useState('');
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!companyName || !logo) {
      setSnackbarMessage('Please enter company name and select a logo.');
      setSnackbarSeverity('warning');
      setOpenSnackbar(true);
      return;
    }

    const formData = new FormData();
    formData.append('companyName', companyName);
    formData.append('logo', logo);

    try {
      const response = await axios.post('https://ledger-flow-backend.vercel.app/api/upload-company', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      setSnackbarMessage('Company uploaded successfully!');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      console.log(response.data);
    } catch (error) {
      setSnackbarMessage('Error uploading the file. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      console.error('Error uploading the file', error);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 450, mx: 'auto', mt: 8, borderRadius: 2 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Upload Company Logo
      </Typography>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            label="Company Name"
            variant="outlined"
            fullWidth
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            InputLabelProps={{
              sx: {
                // Center the label text
                fontSize: '0.875rem', // Make the label smaller
                top: '0%',
                marginTop: '0%', // Move the label to the top
                      },
            }}
            sx={{
              borderRadius: '8px', // Add border radius
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderRadius: '8px', // Add border radius to the fieldset
                },
                '&:hover fieldset': {
                  borderColor: '#3f51b5', // Change border color on hover
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#3f51b5', // Change border color when focused
                },
              },
              height: '36px', // Set a smaller height
              '& input': {
                padding: '8px 14px', // Adjust padding for input
                fontSize: '0.875rem', // Adjust font size
              },
            }}
          />
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="logo-upload"
            type="file"
            onChange={handleLogoChange}
            required
          />
          <label htmlFor="logo-upload">
            <IconButton component="span" color="primary">
              <AttachFileIcon fontSize="medium" />
            </IconButton>
          </label>
        </Box>
        {preview && <Avatar src={preview} sx={{ width: 80, height: 80, mx: 'auto' }} alt="Logo Preview" />}
        <Button
          variant="contained"
          color="primary"
          type="submit"
          sx={{
            borderRadius: '20px', // Make the button more rounded
            height: '36px', // Set a smaller height
            mx: 'auto', // Center the button
            width: '150px', // Set a fixed width for the button
          }}
        >
          Submit
        </Button>
      </form>
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default CompanyForm;
