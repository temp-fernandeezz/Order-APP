"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getCsrfToken, extractCsrfToken } from "@/lib/api";
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

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

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

 const handleChangeItem = (index: number, field: string, value: any) => {
  setItems((prevItems) => {
    const newItems = [...prevItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    return newItems;
  });
};


  const handleCreateClient = async () => {
    if (!newClientName || !newClientEmail) {
      alert("Preencha nome e e-mail.");
      return;
    }

    try {
      await getCsrfToken();
      const csrfToken = extractCsrfToken();

      const response = await api.post(
        "/clients",
        {
          name: newClientName,
          email: newClientEmail,
        },
        {
          headers: {
            "X-XSRF-TOKEN": csrfToken,
          },
        }
      );

      const createdClient = response.data;
      setClients((prev) => [...prev, createdClient]);
      setClientId(createdClient.id);
      setShowModal(false);
      setNewClientName("");
      setNewClientEmail("");
    } catch (error: any) {
      alert("Erro ao criar cliente: " + (error.response?.data?.message || ""));
    }
  };

  const handleSubmit = async () => {
  if (!clientId) {
    alert("Selecione um cliente.");
    return;
  }

  const invalidItem = items.some(
    (item) =>
      !item.product_id ||
      isNaN(Number(item.product_id)) ||
      item.quantity <= 0 ||
      item.unit_price <= 0
  );

  if (invalidItem) {
    alert("Preencha corretamente todos os produtos, quantidades e preços.");
    return;
  }

  setLoading(true);
  setError("");

  const payload = {
    client_id: clientId,
    items: items.map((item) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    })),
  };

  try {
    await getCsrfToken();
    const csrfToken = extractCsrfToken();

    if (!csrfToken) throw new Error("Token CSRF não encontrado.");

    await api.post("/orders", payload, {
      headers: {
        "X-XSRF-TOKEN": csrfToken,
      },
    });

    router.push("/home");
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
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Criar Pedido</h1>
        <button
          onClick={() => setShowModal(true)}
          className="text-blue-600 hover:underline"
        >
          Não tem Clientes? Adicione um
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="mb-6">
        <label className="block font-medium mb-1">Cliente</label>
        <select
          className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      <h2 className="text-lg font-semibold mb-4">Produtos</h2>
      {items.map((item, index) => (
        <div
          key={index}
          className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm"
        >
          {/* Seleção do Produto */}
          <div className="mb-4">
            <label className="block font-medium mb-1">Produto</label>
            <select
              className="w-full border border-gray-300 p-2 rounded-md"
              value={item.product_id}
              onChange={(e) => {
                const selectedProductId = parseInt(e.target.value);
                const selectedProduct = products.find(
                  (p) => p.id === selectedProductId
                );

                handleChangeItem(index, "product_id", selectedProductId);
                if (selectedProduct) {
                  handleChangeItem(index, "unit_price", selectedProduct.price);
                }
              }}
            >
              <option value="">Selecione um produto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantidade */}
          <div className="mb-4">
            <label className="block font-medium mb-1">Quantidade</label>
            <input
              type="number"
              min={1}
              className="w-full border border-gray-300 p-2 rounded-md"
              value={item.quantity}
              onChange={(e) =>
                handleChangeItem(index, "quantity", Number(e.target.value))
              }
            />
          </div>

          {/* Preço Unitário */}
          <div>
            <label className="block font-medium mb-1">Preço Unitário</label>
            <input
              type="number"
              min={0}
              className="w-full border border-gray-300 p-2 rounded-md"
              value={item.unit_price}
              onChange={(e) =>
                handleChangeItem(index, "unit_price", Number(e.target.value))
              }
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={handleAddItem}
      >
        Adicionar Produto
      </button>

      <div className="flex justify-end gap-8">
        <button
          disabled={loading}
          onClick={handleSubmit}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar Pedido"}
        </button>

        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Voltar
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Novo Cliente</h2>

            <label className="block mb-2">
              Nome
              <input
                type="text"
                className="w-full border border-gray-300 p-2 rounded-md mt-1"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />
            </label>

            <label className="block mb-4">
              E-mail
              <input
                type="email"
                className="w-full border border-gray-300 p-2 rounded-md mt-1"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
              />
            </label>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateClient}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Criar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
