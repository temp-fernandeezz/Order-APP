"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Order } from "@/types";
import Link from "next/link";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/orders")
      .then((res) => setOrders(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <Link
          href="/orders/new"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Novo Pedido
        </Link>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border p-4 rounded shadow">
              <p>
                <strong>Cliente:</strong> {order.client.name} (
                {order.client.email})
              </p>
              <p>
                <strong>Total:</strong> R$ {order.total.toFixed(2)}
              </p>
              <ul className="mt-2">
                {order.products.map((product) => (
                  <li key={product.id}>
                    {product.name} - {product.pivot.quantity} x R${" "}
                    {product.pivot.unit_price.toFixed(2)}
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex gap-2">
                <Link
                  href={`/orders/${order.id}/edit`}
                  className="text-blue-600"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
