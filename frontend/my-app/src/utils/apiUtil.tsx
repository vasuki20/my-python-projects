import axios from 'axios';

const apiBaseUrl = 'http://localhost:5000'; // Base URL for API

// Function to initialize axios with the base URL and headers
const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Function to handle access token refresh
const refreshAccessToken = async () => {
  try {
    const response = await axios.post(`${apiBaseUrl}/refresh`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('refreshToken')}`
      }
    });
    localStorage.setItem('token', response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    handleLogout();
    throw new Error('Session expired, please login again.');
  }
};

// Function to log out user and redirect to login page
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login'; // Redirect to login page
};

// API request function that handles token refresh if needed
export const apiRequest = async (method, url, data = null, isFormData = false) => {
  try {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const response = await axios({
      method,
      url: `${apiBaseUrl}${url}`, // Ensure the full API URL is used
      data,
      headers,
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      try {
        const newToken = await refreshAccessToken();
        headers.Authorization = `Bearer ${newToken}`;

        const retryResponse = await axios({
          method,
          url: `${apiBaseUrl}${url}`, // Ensure full API URL
          data,
          headers,
        });

        return retryResponse.data;
      } catch (refreshError) {
        handleLogout();
      }
    } else {
      throw error;
    }
  }
};

