import { useState, useCallback } from 'react';

const useRequest = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [controller, setController] = useState(null);

  const request = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);

    const newController = new AbortController();
    setController(newController);

    try {
      const response = await fetch(url, {
        method: "GET",
        ...options,
        signal: newController.signal,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        setError(errorMessage);
        return;
      }

      const result = await response.json();
      return result;
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
      setController(null);
    }
  }, []);

  const cancel = useCallback(() => {
    if (controller) {
      controller.abort();
      setController(null);
    }
  }, [controller]);

  return { error, loading, request, cancel };
};

export default useRequest;