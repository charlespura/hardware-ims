<?php

namespace Database\Seeders;

use App\Enums\VoucherType;
use App\Models\Supplier;
use App\Models\Voucher;
use Illuminate\Database\Seeder;

class StoreSetupSeeder extends Seeder
{
    public function run(): void
    {
        Voucher::create(['code' => 'WELCOME10', 'description' => 'New customer welcome discount', 'type' => VoucherType::Percentage, 'value' => 10, 'min_spend' => 500, 'max_discount' => 500]);
        Voucher::create(['code' => 'LESS100', 'description' => '₱100 off big orders', 'type' => VoucherType::Fixed, 'value' => 100, 'min_spend' => 1500]);
        Voucher::create(['code' => 'FREESHIP', 'description' => 'Free delivery, no minimum', 'type' => VoucherType::FreeShipping, 'value' => 0, 'usage_limit' => 200]);
        Voucher::create(['code' => 'BUILD2025', 'description' => 'Last year\'s promo (expired)', 'type' => VoucherType::Percentage, 'value' => 15, 'expires_at' => now()->subMonths(2)]);

        Supplier::create(['name' => 'Metro Builders Supply Co.', 'contact_person' => 'Ramon Lim', 'email' => 'orders@metrobuilders.test', 'phone' => '02 8555 0101', 'address' => 'Valenzuela City', 'notes' => 'Cement, steel and blocks. 30-day terms.']);
        Supplier::create(['name' => 'ToolPro Distributors', 'contact_person' => 'Karen Uy', 'email' => 'sales@toolpro.test', 'phone' => '02 8555 0202', 'address' => 'Mandaluyong City', 'notes' => 'Authorized Milwaukee / Makita / Stanley distributor.']);
        Supplier::create(['name' => 'Luzon Tiles & Finishes', 'contact_person' => 'Edwin Castro', 'email' => 'hello@luzontiles.test', 'phone' => '02 8555 0303', 'address' => 'Antipolo, Rizal', 'notes' => 'Tiles, adhesives and paint.']);
    }
}
