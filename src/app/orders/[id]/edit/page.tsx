"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api, { extractCsrfToken, getCsrfToken } from "@/lib/api";
import { Client, Product, OrderItem, Order } from "@/types";

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientId, setClientId] = useState<number | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Buscar o token CSRF antes de carregar os dados
        await getCsrfToken();

        const [orderRes, clientsRes, productsRes] = await Promise.all([
          api.get(`/orders/${orderId}`),
          api.get("/clients"),
          api.get("/products"),
        ]);

        const order: Order = orderRes.data;
        setClients(clientsRes.data);
        setProducts(productsRes.data);
        setClientId(order.client.id);

        const mappedItems: OrderItem[] = order.products.map((p) => ({
          product_id: p.id,
          quantity: Number(p.pivot.quantity),
          unit_price: Number(p.pivot.unit_price),
        }));

        setItems(mappedItems);
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err);
        setError(err.response?.data?.message || "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { product_id: products[0]?.id || 0, quantity: 1, unit_price: 0 },
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

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce(
    (acc, item) => acc + item.quantity * item.unit_price,
    0
  );

  const handleSubmit = async () => {
    if (!clientId || items.length === 0) {
      alert("Preencha todos os campos");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      client_id: clientId,
      items,
    };

    try {
      await getCsrfToken();
      const csrfToken = extractCsrfToken();

      if (!csrfToken) throw new Error("Token CSRF não encontrado.");

      await api.put(`/orders/${orderId}`, payload, {
        headers: {
          "X-XSRF-TOKEN": csrfToken,
        },
      });

      router.push("/home");
    } catch (err: any) {
      console.error("Erro ao atualizar pedido:", err);
      setError(err.response?.data?.message || "Erro ao atualizar pedido");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="p-6">Carregando...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Editar Pedido #{orderId}</h1>

      <div>
        <label className="block mb-1">Cliente</label>
        <select
          className="border p-2 rounded w-full"
          value={clientId ?? ""}
          onChange={(e) => setClientId(Number(e.target.value))}
        >
          <option value="">Selecione um cliente</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} ({client.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <h2 className="font-medium mb-2">Produtos</h2>
        {items.map((item, index) => {
          const selectedProduct = products.find(
            (p) => p.id === item.product_id
          );

          return (
            <div
              key={index}
              className="border p-4 mb-4 rounded-md bg-gray-50 space-y-2"
            >
              <div className="grid grid-cols-5 gap-2 items-center">
                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">
                    Produto
                  </label>
                  <select
                    className="border p-2 rounded w-full"
                    value={item.product_id}
                    onChange={(e) =>
                      handleChangeItem(
                        index,
                        "product_id",
                        Number(e.target.value)
                      )
                    }
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      handleChangeItem(index, "quantity", e.target.value)
                    }
                    className="border p-2 rounded w-full"
                    placeholder="Quantidade"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">
                    Preço Unitário
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={item.unit_price}
                    onChange={(e) =>
                      handleChangeItem(index, "unit_price", e.target.value)
                    }
                    className="border p-2 rounded w-full"
                    placeholder="Preço unitário"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">
                    Total
                  </label>
                  <span className="block p-2 bg-white border rounded">
                    R${" "}
                    {(Number(item.quantity) * Number(item.unit_price)).toFixed(
                      2
                    )}
                  </span>
                </div>

                <div className="col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-600 font-bold text-xl ml-2"
                    title="Remover produto"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={handleAddItem}
          className="mt-2 px-4 py-2 bg-gray-200 rounded"
        >
          Adicionar Produto
        </button>
      </div>

      <div className="text-right font-semibold">
        Total: R$ {total.toFixed(2)}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="px-6 py-2 bg-blue-600 text-white rounded"
      >
        Salvar Alterações
      </button>
    </div>
  );
}
