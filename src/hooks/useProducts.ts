import { useEffect, useState } from "react";
import api, { getCsrfToken, extractCsrfToken } from "@/lib/api";
import { Product } from "@/types";

export default function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        await getCsrfToken();
        const csrfToken = extractCsrfToken();
        if (!csrfToken) throw new Error("CSRF token não encontrado");

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
  }, []);

  return { products, loading, error };
}
