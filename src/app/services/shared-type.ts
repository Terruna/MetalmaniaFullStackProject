// shared-types.ts
export interface ProductImage {
  id: number;
  url: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  stock: number;
  images: ProductImage[];
  status: number;
  createdAt: string;
 
}

export interface CartItem {
  id?: number;
  productId: number;
  quantity: number;
  size: number; 
  product?: Product;
  sizeName?: string
}

export interface ApiResponse {
  status: boolean;
  statusCode: number;
  data: any;
    message?: string; 
  errors?: string[];
}

export interface CartResponse {
  id: number;
  userId: number;
  createdAt: string;
  items: CartItem[];
}
export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

export interface CreateContactMessageRequest {
  name: string;
  email: string;
  message: string;
}