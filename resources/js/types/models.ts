export type Role = 'admin' | 'staff' | 'customer';

export type OrderStatus =
    | 'pending'
    | 'processing'
    | 'out_for_delivery'
    | 'ready_for_pickup'
    | 'completed'
    | 'cancelled';

export type PaymentStatus =
    | 'unpaid'
    | 'for_verification'
    | 'paid'
    | 'rejected'
    | 'refunded';

export type PaymentMethod = 'cod' | 'gcash' | 'bank_transfer' | 'cash';
export type Fulfillment = 'delivery' | 'pickup';
export type Channel = 'online' | 'pos';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type StockMovementType =
    | 'initial'
    | 'purchase'
    | 'sale'
    | 'cancellation'
    | 'adjustment';
export type VoucherType = 'percentage' | 'fixed' | 'free_shipping';
export type PurchaseOrderStatus = 'ordered' | 'received' | 'cancelled';

/** Laravel sends decimals as strings ("1250.00"). */
export type Money = string | number;

export type Category = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    products_count?: number;
};

export type Brand = {
    id: number;
    name: string;
    slug: string;
    products_count?: number;
};

export type Product = {
    id: number;
    category_id: number;
    brand_id: number | null;
    name: string;
    slug: string;
    sku: string;
    model: string | null;
    description?: string | null;
    specifications?: string | null;
    unit: string;
    cost_price?: Money;
    price: Money;
    stock: number;
    reorder_level: number;
    image_path: string | null;
    image_url: string | null;
    stock_status: StockStatus;
    is_active?: boolean;
    is_featured?: boolean;
    deleted_at?: string | null;
    created_at?: string;
    category?: Pick<Category, 'id' | 'name' | 'slug'>;
    brand?: Pick<Brand, 'id' | 'name' | 'slug'> | null;
};

export type Address = {
    id: number;
    label: string;
    recipient_name: string;
    phone: string;
    street: string;
    barangay: string | null;
    city: string;
    province: string;
    postal_code: string | null;
    is_default: boolean;
};

export type CartLine = {
    id: number;
    quantity: number;
    issue: null | 'unavailable' | 'out_of_stock' | 'insufficient';
    product: Product;
};

export type Quote = {
    subtotal: number;
    discount: number;
    shipping_fee: number;
    total: number;
    voucher: { code: string; summary: string } | null;
    voucher_error: string | null;
};

export type OrderItem = {
    id: number;
    product_id: number | null;
    product_name: string;
    sku: string;
    unit_price: Money;
    unit_cost?: Money;
    quantity: number;
    line_total: Money;
    product?: Pick<
        Product,
        'id' | 'slug' | 'image_url' | 'stock' | 'stock_status'
    > | null;
};

export type OrderActivity = {
    id: number;
    status: OrderStatus | null;
    title: string;
    note: string | null;
    created_at: string;
    user?: { id: number; name: string; role: Role } | null;
};

export type Order = {
    id: number;
    number: string;
    user_id: number | null;
    channel: Channel;
    status: OrderStatus;
    fulfillment: Fulfillment;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    shipping_address: string | null;
    preferred_date: string | null;
    notes: string | null;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    payment_reference: string | null;
    payment_proof_url: string | null;
    payment_rejection_reason: string | null;
    paid_at: string | null;
    voucher_code: string | null;
    subtotal: Money;
    discount: Money;
    shipping_fee: Money;
    total: Money;
    amount_tendered: Money | null;
    change_due: Money | null;
    placed_at: string;
    completed_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    items_count?: number;
    items?: OrderItem[];
    activities?: OrderActivity[];
    customer?: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        created_at: string;
    } | null;
    processor?: { id: number; name: string } | null;
};

export type StockMovement = {
    id: number;
    type: StockMovementType;
    quantity: number;
    balance_after: number;
    note: string | null;
    created_at: string;
    product?: Pick<Product, 'id' | 'name' | 'sku' | 'unit'> | null;
    user?: { id: number; name: string } | null;
    reference?: { type: string; number: string | null } | null;
};

export type Voucher = {
    id: number;
    code: string;
    description: string | null;
    type: VoucherType;
    value: Money;
    min_spend: Money;
    max_discount: Money | null;
    usage_limit: number | null;
    times_used: number;
    starts_at: string | null;
    expires_at: string | null;
    is_active: boolean;
    summary: string;
};

export type Supplier = {
    id: number;
    name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
    purchase_orders_count?: number;
    received_total?: Money | null;
};

export type PurchaseOrderItem = {
    id: number;
    product_id: number;
    quantity: number;
    unit_cost: Money;
    line_total: Money;
    product: Pick<
        Product,
        'id' | 'name' | 'sku' | 'unit' | 'stock' | 'reorder_level'
    >;
};

export type PurchaseOrder = {
    id: number;
    number: string;
    supplier_id: number;
    status: PurchaseOrderStatus;
    expected_at: string | null;
    received_at: string | null;
    cancelled_at: string | null;
    total: Money;
    notes: string | null;
    created_at: string;
    items_count?: number;
    supplier?: Supplier;
    items?: PurchaseOrderItem[];
    creator?: { id: number; name: string } | null;
    receiver?: { id: number; name: string } | null;
};

export type ManagedUser = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: Role;
    is_active: boolean;
    created_at: string;
    orders_count: number;
    total_spent: Money | null;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
    next_page_url: string | null;
    prev_page_url: string | null;
};

export type PaymentAccount = {
    label: string;
    account_name: string;
    account_number: string;
};

export type StoreInfo = {
    name: string;
    tagline: string;
    email: string;
    phone: string;
    address: string;
    business_hours: string;
    shipping_fee: number;
    free_shipping_threshold: number;
};
