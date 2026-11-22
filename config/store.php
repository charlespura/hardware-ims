<?php

/*
|--------------------------------------------------------------------------
| Store settings
|--------------------------------------------------------------------------
|
| Business rules and contact details used across the storefront, checkout,
| receipts and e-mails. Override any value from your .env file.
|
*/

return [
    'name' => env('APP_NAME', 'HardwareHub IMS'),

    'tagline' => env('STORE_TAGLINE', 'Tools, materials and supplies — delivered or ready for pickup.'),

    'email' => env('STORE_EMAIL', 'hello@hardwarehub.test'),

    'phone' => env('STORE_PHONE', '(02) 8123 4567'),

    'address' => env('STORE_ADDRESS', '123 Rizal Avenue, Quezon City, Metro Manila'),

    'business_hours' => env('STORE_HOURS', 'Mon–Sat, 8:00 AM – 6:00 PM'),

    // Flat delivery fee and the subtotal at which delivery becomes free.
    'shipping_fee' => (float) env('STORE_SHIPPING_FEE', 45),

    'free_shipping_threshold' => (float) env('STORE_FREE_SHIPPING_THRESHOLD', 5000),

    // Customers may pick a preferred delivery / pickup date this many days ahead.
    'max_schedule_days' => (int) env('STORE_MAX_SCHEDULE_DAYS', 30),

    // Accounts shown to customers who pay by GCash or bank transfer.
    'payment_accounts' => [
        'gcash' => [
            'label' => 'GCash',
            'account_name' => env('STORE_GCASH_NAME', 'HardwareHub Trading'),
            'account_number' => env('STORE_GCASH_NUMBER', '0917 123 4567'),
        ],
        'bank_transfer' => [
            'label' => env('STORE_BANK_NAME', 'BDO Unibank'),
            'account_name' => env('STORE_BANK_ACCOUNT_NAME', 'HardwareHub Trading'),
            'account_number' => env('STORE_BANK_ACCOUNT_NUMBER', '0012 3456 7890'),
        ],
    ],
];
