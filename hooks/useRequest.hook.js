import { useState, useCallback } from 'react';

const useRequest = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [controller, setController] = useState(null);

  const request = async (url, options = {}, body = {}) => {
    setLoading(true);
    setError(null);

    const newController = new AbortController();
    setController(newController);

    try {
      const requestConfig = {
        method: "GET",
        ...options,
        signal: newController.signal,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      if (requestConfig.method == "POST") {
        requestConfig.body = JSON.stringify(body);
      }

      const response = await fetch(url, requestConfig);

      if (!response.ok) {
        const errorMessage = await response.json();
        setError(errorMessage);
        return { error: errorMessage.error };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      setError(error);
      return { error };
    } finally {
      setLoading(false);
      setController(null);
    }
  };

  const cancel = useCallback(() => {
    if (controller) {
      controller.abort();
      setController(null);
    }
  }, [controller]);

  return { error, loading, request, cancel };
};

export default useRequest;