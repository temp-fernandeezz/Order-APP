import { useCsrfToken } from "@/hooks/useCsrfToken";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Product } from "@/types";

export default function useProducts() {
  const csrfToken = useCsrfToken();
  const tokenLoading = !csrfToken;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    if (tokenLoading || !csrfToken) return;

    const fetchProducts = async () => {
      try {
        const response = await api.get("/products", {
          headers: { "X-XSRF-TOKEN": csrfToken },
        });
        setProducts(response.data);
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
        setError("Erro ao carregar produtos.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [csrfToken, tokenLoading]);

  return { products, loading: loading || tokenLoading, error };
}
