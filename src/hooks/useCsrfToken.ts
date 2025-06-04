import { useEffect, useState } from "react";
import { getCsrfToken, extractCsrfToken } from "@/lib/api";

export const useCsrfToken = () => {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      await getCsrfToken();
      const token = extractCsrfToken();
      setCsrfToken(token);
    };

    fetchToken();
  }, []);

  return csrfToken;
};
