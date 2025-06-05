"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getCsrfToken, extractCsrfToken } from "@/lib/api";
import { Order } from "@/types";
import { Trash2, Pencil, PlusCircle, LogOut } from "lucide-react";
import Link from "next/link";

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

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir este pedido?"
    );
    if (!confirmDelete) return;

    try {
      await getCsrfToken();
      const csrfToken = extractCsrfToken();
      if (!csrfToken) throw new Error("Token CSRF não encontrado.");

      await api.delete(`/orders/${id}`, {
        headers: { "X-XSRF-TOKEN": csrfToken },
      });

      setOrders((prev) => prev.filter((order) => order.id !== id));
    } catch (err: any) {
      console.error("Erro ao excluir:", err);
      alert(err.response?.data?.message || "Erro ao excluir pedido.");
    }
  };

  const handleLogout = async () => {
    try {
      await getCsrfToken();
      const csrfToken = extractCsrfToken();

      await api.post(
        "/logout",
        {},
        {
          headers: { "X-XSRF-TOKEN": csrfToken },
        }
      );

      router.push("/login");
    } catch (err: any) {
      console.error("Erro ao fazer logout:", err);
      alert("Erro ao sair.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Pedidos</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/products/new")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2"
          >
            <PlusCircle size={18} />
            Criar Produto
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-700 transition flex items-center gap-2"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
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
          {orders.map((order) => {
            const total = order.products.reduce(
              (acc, product) =>
                acc + product.pivot.quantity * Number(product.pivot.unit_price),
              0
            );

            return (
              <div
                key={order.id}
                className="border rounded-xl p-4 bg-white shadow-md"
              >
                <h2 className="text-xl font-bold mb-1">
                  Cliente: {order.client.name}
                </h2>
                <p className="text-sm text-gray-600 mb-2">
                  Email: {order.client.email}
                </p>

                <ul className="mb-2 space-y-1">
                  {order.products.map((product) => (
                    <li key={product.id} className="text-sm">
                      {product.name} — {product.pivot.quantity} × R${" "}
                      {Number(product.pivot.unit_price).toFixed(2)}
                    </li>
                  ))}
                </ul>

                <p className="font-semibold mb-3">
                  Total:{" "}
                  <span className="text-green-600">R$ {total.toFixed(2)}</span>
                </p>

                <div className="flex gap-4 text-sm">
                  <Link
                    href={`/orders/${order.id}/edit`}
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Pencil size={16} />
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="flex items-center gap-1 text-red-600 hover:underline"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
