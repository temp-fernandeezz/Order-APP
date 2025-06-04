"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getCsrfToken, extractCsrfToken } from "@/lib/api";

interface Client {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

interface OrderItem {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientId, setClientId] = useState<number | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        await getCsrfToken();
        const csrfToken = extractCsrfToken();
        if (!csrfToken) throw new Error("CSRF token não encontrado");

        const [clientRes, productRes] = await Promise.all([
          api.get("/clients", { headers: { "X-XSRF-TOKEN": csrfToken } }),
          api.get("/products", { headers: { "X-XSRF-TOKEN": csrfToken } }),
        ]);

        setClients(clientRes.data);
        setProducts(productRes.data);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddItem = () => {
    if (products.length === 0) return;
    setItems([
      ...items,
      {
        product_id: products[0].id,
        quantity: 1,
        unit_price: products[0].price || 0,
      },
    ]);
  };

  const handleChangeItem = (
    index: number,
    field: keyof OrderItem,
    value: any
  ) => {
    const updated = [...items];
    updated[index][field] =
      field === "quantity" || field === "unit_price"
        ? parseFloat(value)
        : value;
    setItems(updated);
  };

  const total = items.reduce(
    (acc, item) => acc + item.quantity * item.unit_price,
    0
  );

  const handleSubmit = async () => {
    if (!clientId || items.length === 0)
      return alert("Preencha todos os campos");

    setSaving(true);
    setError("");

    try {
      await getCsrfToken();
      const csrfToken = extractCsrfToken();
      if (!csrfToken) throw new Error("CSRF token não encontrado");

      await api.post(
        "/orders",
        { client_id: clientId, items },
        {
          headers: {
            "X-XSRF-TOKEN": csrfToken,
          },
        }
      );

      router.push("/orders");
    } catch (err: any) {
      console.error("Erro ao criar pedido:", err);
      let errorMessage = "Erro ao criar pedido.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-4">Carregando...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Novo Pedido</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-4">
        <label className="block mb-1">Cliente</label>
        <select
          value={clientId ?? ""}
          onChange={(e) => setClientId(Number(e.target.value))}
          className="w-full border p-2 rounded"
        >
          <option value="">Selecione um cliente</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold mb-2">Itens</h2>
        {items.map((item, index) => (
          <div key={index} className="mb-2 flex gap-2 items-center">
            <select
              value={item.product_id}
              onChange={(e) =>
                handleChangeItem(index, "product_id", Number(e.target.value))
              }
              className="border p-2 rounded w-1/3"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) =>
                handleChangeItem(index, "quantity", e.target.value)
              }
              className="border p-2 rounded w-1/4"
            />

            <input
              type="number"
              step="0.01"
              value={item.unit_price}
              onChange={(e) =>
                handleChangeItem(index, "unit_price", e.target.value)
              }
              className="border p-2 rounded w-1/4"
            />
          </div>
        ))}

        <button
          onClick={handleAddItem}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Adicionar Item
        </button>
      </div>

      <div className="mb-4">
        <strong>Total: R$ {total.toFixed(2)}</strong>
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Criar Pedido"}
      </button>
    </div>
  );
}
