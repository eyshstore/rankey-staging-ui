const isProduction = process.env.NODE_ENV === 'production';

const config = {
  apiBaseUrl: isProduction ? process.env.REACT_APP_API_BASE_URL : 'http://localhost:7000',
};

export default config;