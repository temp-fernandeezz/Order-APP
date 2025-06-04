"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api, { getCsrfToken, extractCsrfToken } from "@/lib/api";

export default function CreateProductPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createProduct = async (data: { name: string; price: number }) => {
    try {
      await getCsrfToken();
      const csrfToken = extractCsrfToken();
      if (!csrfToken) {
        throw new Error("CSRF token não encontrado");
      }

      const response = await api.post("/products", data, {
        headers: {
          "X-XSRF-TOKEN": csrfToken,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !price.trim()) {
      setError("Nome e preço são obrigatórios.");
      return;
    }

    const parsedPrice = parseFloat(price.replace(",", "."));
    if (isNaN(parsedPrice)) {
      setError("Preço inválido.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createProduct({ name, price: parsedPrice });
      router.push("/home");
    } catch (err: any) {
      let message = "Erro ao criar produto.";
      if (err.response?.data?.message) {
        message = err.response.data.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Cadastrar Produto</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-4">
        <label className="block mb-1">Nome do Produto</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Preço</label>
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Ex: 19.99"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Cadastrar Produto"}
      </button>
    </div>
  );
}
