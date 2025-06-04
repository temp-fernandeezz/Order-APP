"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
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

  useEffect(() => {
    // Buscar dados do pedido, clientes e produtos
    Promise.all([
      api.get(`/orders/${orderId}`),
      api.get("/clients"),
      api.get("/products"),
    ])
      .then(([orderRes, clientsRes, productsRes]) => {
        const order: Order = orderRes.data;
        setClients(clientsRes.data);
        setProducts(productsRes.data);
        setClientId(order.client.id);
        // Mapear produtos para OrderItem com product_id, quantity e unit_price
        const mappedItems: OrderItem[] = order.products.map((p) => ({
          product_id: p.id,
          quantity: p.pivot.quantity,
          unit_price: p.pivot.unit_price,
        }));
        setItems(mappedItems);
      })
      .finally(() => setLoading(false));
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
    if (!clientId || items.length === 0)
      return alert("Preencha todos os campos");

    try {
      await api.put(`/orders/${orderId}`, {
        client_id: clientId,
        items,
      });

      router.push("/orders");
    } catch (error) {
      alert("Erro ao atualizar pedido");
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
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-5 gap-2 mb-2 items-center">
            <select
              className="border p-2 rounded"
              value={item.product_id}
              onChange={(e) =>
                handleChangeItem(index, "product_id", Number(e.target.value))
              }
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) =>
                handleChangeItem(index, "quantity", e.target.value)
              }
              className="border p-2 rounded"
              placeholder="Quantidade"
            />
            <input
              type="number"
              step="0.01"
              min={0}
              value={item.unit_price}
              onChange={(e) =>
                handleChangeItem(index, "unit_price", e.target.value)
              }
              className="border p-2 rounded"
              placeholder="Preço unitário"
            />
            <span>R$ {(item.quantity * item.unit_price).toFixed(2)}</span>
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              className="text-red-600 font-bold"
              title="Remover produto"
            >
              ×
            </button>
          </div>
        ))}

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
