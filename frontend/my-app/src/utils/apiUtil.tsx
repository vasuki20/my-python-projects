import axios from 'axios';

const apiBaseUrl = 'http://127.0.0.1:5000'; // Base URL for API

// Function to initialize axios with the base URL and headers
const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Export the instance to be used in other parts of the application
export default axiosInstance;

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
export const apiRequest = async (method: string, url: string, data: any = null, isFormData: boolean = false): Promise<any> => {
  let headers: { [key: string]: string } = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  try {
    // When sending FormData, do not set Content-Type header manually,
    // as the browser will set it to multipart/form-data with the correct boundary.
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const response = await axios({
      method,
      url: `${apiBaseUrl}${url}`, // Ensure the full API URL is used
      data, // data can be FormData, null, or JSON object
      headers,
    });

    return response.data;
  } catch (error: any) { // Explicitly type error
    if (error.response && error.response.status === 401) {
      try {
        const newToken = await refreshAccessToken();
        // Update headers with the new token for the retry
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
        // Re-throw to indicate failure after refresh attempt
        throw refreshError;
      }
    } else {
      // Re-throw other errors
      throw error;
    }
  }
};
