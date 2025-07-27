import { useState, useCallback } from 'react';

const useRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (url, method = 'GET', body = null, headers = {}) => {
    setLoading(true);
    setError(null);

    try {
      let options = {
        method,
        credentials: "include",
        headers: { ...headers }
      };

      if (body) {
        options.body = JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        setError(data);
        throw new Error(data.message || "Something went wrong.");
      }

      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { loading, request, error, clearError };
};

export default useRequest;
