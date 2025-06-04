export interface Client {
  id: number;
  name: string;
  email: string;
}

export interface Product {
  id: number;
  name: string;
}

export interface OrderItem {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  client: Client;
  total: number;
  products: (Product & {
    pivot: {
      quantity: number;
      unit_price: number;
    };
  })[];
}

export interface OrderItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface ClientInput {
  name: string;
  email: string;
}

export interface CreateOrderInput {
  client: ClientInput;
  items: OrderItemInput[];
}
