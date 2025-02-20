import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CompanyLogo = ({ onLogoLoaded }) => {
  const [companyLogo, setCompanyLogo] = useState(null);

  useEffect(() => {
    const companyId = localStorage.getItem("company_id");
    if (companyId) {
      axios.get(`http://localhost:5000/api/company/${companyId}`, { responseType: 'blob' })
        .then(response => {
          const url = URL.createObjectURL(response.data);
          setCompanyLogo(url);
          if (onLogoLoaded) {
            onLogoLoaded(url); // Call the callback with the logo URL
          }
        })
        .catch(error => console.error('Error fetching company logo:', error));
    }
  }, [onLogoLoaded]);

  return (
    <>
      {companyLogo && (
        <img
          src={companyLogo}
          alt="Company Logo"
          style={{ width: '100px', height: 'auto' }} // Adjust size as needed
        />
      )}
    </>
  );
};

export default CompanyLogo;