"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getCsrfToken } from "@/lib/api";
import { OrderItemInput } from "@/types";

export default function CreateOrderPage() {
  const router = useRouter();

  const [clientId, setClientId] = useState<number | null>(null);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);

  const [items, setItems] = useState<OrderItemInput[]>([
    { product_id: "", quantity: 1, unit_price: 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      await getCsrfToken();

      const clientsRes = await api.get("/clients");
      const productsRes = await api.get("/products");

      setClients(clientsRes.data);
      setProducts(productsRes.data);
    } catch (err: any) {
      console.error("Erro:", err);
      setError(err.response?.data?.message || "Erro ao carregar dados");

      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [router]);

  const handleAddItem = () => {
    setItems([...items, { product_id: "", quantity: 1, unit_price: 0 }]);
  };

  const handleChangeItem = (
    index: number,
    field: keyof OrderItemInput,
    value: string | number
  ) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]:
        field === "quantity" || field === "unit_price"
          ? Number(value)
          : value,
    };
    setItems(updatedItems);
  };

  const handleSubmit = async () => {
    if (!clientId) {
      alert("Selecione um cliente.");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      client_id: clientId,
      items: items.map((item) => ({
        ...item,
        product_id: Number(item.product_id),
      })),
    };

    try {
      await getCsrfToken();
      await api.post("/orders", payload);
      router.push("/orders");
    } catch (err: any) {
      console.error("Erro ao criar pedido:", err);
      setError(err.response?.data?.message || "Erro ao criar pedido");
      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Criar Pedido</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="mb-4">
        <label className="block mb-1">Cliente</label>
        <select
          className="w-full border p-2 rounded"
          value={clientId ?? ""}
          onChange={(e) => setClientId(Number(e.target.value))}
        >
          <option value="">Selecione um cliente</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <h2 className="text-lg font-semibold mb-2">Produtos</h2>
      {items.map((item, index) => (
        <div key={index} className="mb-4 border p-4 rounded">
          <div className="mb-2">
            <label className="block mb-1">Produto</label>
            <select
              className="w-full border p-2 rounded"
              value={item.product_id}
              onChange={(e) =>
                handleChangeItem(index, "product_id", e.target.value)
              }
            >
              <option value="">Selecione um produto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-2">
            <label className="block mb-1">Quantidade</label>
            <input
              type="number"
              min={1}
              className="w-full border p-2 rounded"
              value={item.quantity}
              onChange={(e) =>
                handleChangeItem(index, "quantity", e.target.value)
              }
            />
          </div>

          <div>
            <label className="block mb-1">Preço Unitário</label>
            <input
              type="number"
              min={0}
              className="w-full border p-2 rounded"
              value={item.unit_price}
              onChange={(e) =>
                handleChangeItem(index, "unit_price", e.target.value)
              }
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={handleAddItem}
      >
        Adicionar Produto
      </button>

      <div>
        <button
          disabled={loading}
          onClick={handleSubmit}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar Pedido"}
        </button>
      </div>
    </div>
  );
}
