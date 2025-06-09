import { useState, useCallback } from 'react';

const useRequest = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  let controller = null;

  const request = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);
    setData(null);

    controller = new AbortController();
    const signal = controller.signal;

    try {
      const response = await fetch(url, { ...options, signal });
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Request failed');
      }
      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const cancel = useCallback(() => {
    if (controller) {
      controller.abort();
    }
  }, []);

  return { data, error, loading, request, cancel };
};

export default useRequest;