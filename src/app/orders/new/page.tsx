"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Client,
  Product,
  OrderItemInput,
  CreateOrderInput,
  ClientInput,
} from "@/types";
import api, { getCsrfToken, extractCsrfToken } from "@/lib/api";

export default function NewOrderPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [client, setClient] = useState<ClientInput>({ name: "", email: "" });
  const [items, setItems] = useState<OrderItemInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        await getCsrfToken();
        const csrfToken = extractCsrfToken();
        if (!csrfToken) throw new Error("CSRF token não encontrado");

        const response = await api.get("/products", {
          headers: { "X-XSRF-TOKEN": csrfToken },
          withCredentials: true,
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

  const handleAddItem = () => {
    if (products.length === 0) return;
    setItems([
      ...items,
      {
        product_id: products[0].id.toString(),
        quantity: 1,
        unit_price: 0,
      },
    ]);
  };

  const handleChangeItem = <K extends keyof OrderItemInput>(
    index: number,
    field: K,
    value: OrderItemInput[K]
  ) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]:
        field === "quantity" || field === "unit_price"
          ? Number(value)
          : value,
    };
    setItems(updated);
  };

  const total = items.reduce(
    (acc, item) => acc + item.quantity * item.unit_price,
    0
  );

  const handleSubmit = async () => {
    if (!client.name || !client.email || items.length === 0)
      return alert("Preencha todos os campos");

    setSaving(true);
    setError("");

    try {
      await getCsrfToken();
      const csrfToken = extractCsrfToken();
      if (!csrfToken) throw new Error("CSRF token não encontrado");

      const orderPayload: CreateOrderInput = {
        client,
        items,
      };
      await api.post("/orders", orderPayload, {
        headers: { "X-XSRF-TOKEN": csrfToken },
        withCredentials: true,
      });
      

      router.push("/orders");
    } catch (err: any) {
      console.error("Erro ao criar pedido:", err);
      let message = "Erro ao criar pedido.";
      if (err.response) {
        if (err.response.status === 419) {
          message = "Sess o expirada. Por favor, recarregue a p gina e tente novamente.";
        } else if (err.response.data?.message) {
          message = err.response.data.message;
        }
      }
      setError(message);
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
        <label className="block mb-1">Nome do Cliente</label>
        <input
          type="text"
          value={client.name}
          onChange={(e) => setClient({ ...client, name: e.target.value })}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Email do Cliente</label>
        <input
          type="email"
          value={client.email}
          onChange={(e) => setClient({ ...client, email: e.target.value })}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="mb-4">
        <h2 className="font-semibold mb-2">Itens</h2>
        {items.map((item, index) => (
          <div key={index} className="mb-2 flex gap-2 items-center">
            <select
              value={item.product_id}
              onChange={(e) =>
                handleChangeItem(index, "product_id", e.target.value)
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
