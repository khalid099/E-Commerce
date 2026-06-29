export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ApiResponse<T = void> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
  path: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  /** Mean value of realised (non-cancelled) orders; 0 when there are none. */
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  topProducts: Array<{
    productId: string;
    productName: string;
    unitsSold: number;
    revenue: number;
    /** Live product image/category for the dashboard thumbnail; null if the product was removed. */
    imageUrl: string | null;
    categoryName: string | null;
  }>;
  /** Realised revenue per calendar month for the trailing 6 months, oldest first. */
  revenueByMonth: Array<{
    /** YYYY-MM key. */
    month: string;
    /** Short month label, e.g. "Jan". */
    label: string;
    revenue: number;
    orders: number;
  }>;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}
