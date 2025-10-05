export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    created_at: Date;
}
export interface Listing {
    id: string;
    host_id: string;
    title: string;
    location: string;
    price: number;
    features: string[];
    image_url: string;
    is_active: boolean;
    created_at: Date;
    host?: User;
}
export interface Booking {
    id: string;
    listing_id: string;
    user_id: string;
    start_date: string;
    end_date: string;
    total_price: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    created_at: Date;
    listing?: Listing;
    user?: User;
}
export interface Message {
    id: string;
    booking_id: string;
    sender_id: string;
    message: string;
    created_at: Date;
    sender?: User;
}
export interface AuthRequest {
    email: string;
    password: string;
    name?: string;
}
export interface AuthResponse {
    success: boolean;
    token?: string;
    user?: User;
    message?: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface SearchFilters {
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    features?: string[];
    isActive?: boolean;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
//# sourceMappingURL=index.d.ts.map