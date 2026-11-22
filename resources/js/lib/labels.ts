import type {
    Channel,
    Fulfillment,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    PurchaseOrderStatus,
    Role,
    StockMovementType,
    StockStatus,
    VoucherType,
} from '@/types';

/** Visual tone used by <StatusBadge>. */
export type Tone =
    | 'neutral'
    | 'info'
    | 'warning'
    | 'success'
    | 'danger'
    | 'brand';

type Meta = { label: string; tone: Tone };

export const orderStatus: Record<OrderStatus, Meta> = {
    pending: { label: 'Pending', tone: 'warning' },
    processing: { label: 'Processing', tone: 'info' },
    out_for_delivery: { label: 'Out for delivery', tone: 'brand' },
    ready_for_pickup: { label: 'Ready for pickup', tone: 'brand' },
    completed: { label: 'Completed', tone: 'success' },
    cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const paymentStatus: Record<PaymentStatus, Meta> = {
    unpaid: { label: 'Unpaid', tone: 'neutral' },
    for_verification: { label: 'For verification', tone: 'warning' },
    paid: { label: 'Paid', tone: 'success' },
    rejected: { label: 'Proof rejected', tone: 'danger' },
    refunded: { label: 'Refund due', tone: 'info' },
};

export const stockStatus: Record<StockStatus, Meta> = {
    in_stock: { label: 'In stock', tone: 'success' },
    low_stock: { label: 'Low stock', tone: 'warning' },
    out_of_stock: { label: 'Out of stock', tone: 'danger' },
};

export const purchaseOrderStatus: Record<PurchaseOrderStatus, Meta> = {
    ordered: { label: 'Awaiting delivery', tone: 'warning' },
    received: { label: 'Received', tone: 'success' },
    cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const paymentMethodLabel: Record<PaymentMethod, string> = {
    cod: 'Cash on delivery / pickup',
    gcash: 'GCash',
    bank_transfer: 'Bank transfer',
    cash: 'Cash',
};

export const fulfillmentLabel: Record<Fulfillment, string> = {
    delivery: 'Home delivery',
    pickup: 'Store pickup',
};

export const channelLabel: Record<Channel, string> = {
    online: 'Online',
    pos: 'Walk-in',
};

export const movementLabel: Record<StockMovementType, string> = {
    initial: 'Opening stock',
    purchase: 'PO received',
    sale: 'Sale',
    cancellation: 'Restocked (cancelled)',
    adjustment: 'Adjustment',
};

export const roleLabel: Record<Role, string> = {
    admin: 'Admin',
    staff: 'Staff',
    customer: 'Customer',
};

export const voucherTypeLabel: Record<VoucherType, string> = {
    percentage: 'Percent off',
    fixed: 'Fixed amount',
    free_shipping: 'Free shipping',
};
