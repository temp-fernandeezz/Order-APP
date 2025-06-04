"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getCsrfToken } from "@/lib/api";
import { Order } from "@/types";

export default function HomeScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        await getCsrfToken();
        const response = await api.get("/orders");
        setOrders(response.data);
      } catch (err: any) {
        console.error("Erro ao buscar pedidos:", err);
        setError(err.response?.data?.message || "Erro ao carregar pedidos");

        if (err.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Pedidos</h1>
        <button
          onClick={() => router.push("/products/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          Criar Produto
        </button>
        <button
          onClick={() => router.push("/clients/create")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          Criar Cliente
        </button>
      </div>


      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : orders.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-gray-500 text-lg mb-4">
            Você ainda não tem nenhum pedido.
          </p>
          <button
            onClick={() => router.push("/orders/create")}
            className="inline-block bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Criar seu primeiro pedido
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border rounded-xl p-4 bg-white shadow-md"
            >
              <h2 className="text-xl font-bold mb-2">
                Cliente: {order.client.name}
              </h2>
              <p className="text-sm text-gray-600 mb-2">
                Email: {order.client.email}
              </p>

              <ul className="mb-2 space-y-1">
                {order.products.map((product) => (
                  <li key={product.id} className="text-sm">
                    {product.name} — {product.pivot.quantity} × R${" "}
                    {product.pivot.unit_price.toFixed(2)}
                  </li>
                ))}
              </ul>

              <p className="font-semibold">
                Total:{" "}
                <span className="text-green-600">
                  R$ {order.total.toFixed(2)}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
