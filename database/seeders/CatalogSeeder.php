<?php

namespace Database\Seeders;

use App\Enums\StockMovementType;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class CatalogSeeder extends Seeder
{
    /**
     * The original HARDWARE IMS catalog, cleaned up and re-categorised,
     * plus a few extra items to show low / out-of-stock states.
     */
    public function run(InventoryService $inventory): void
    {
        $categories = collect([
            'Power Tools' => 'Drills, grinders and blades for faster work.',
            'Hand Tools' => 'Hammers, screwdrivers, ladders and everyday tools.',
            'Building Materials' => 'Cement, blocks and steel for the structure.',
            'Fasteners' => 'Nails, screws and fixings.',
            'Plumbing' => 'Pipes and fittings.',
            'Paint & Finishing' => 'Paints, sandpaper and finishing supplies.',
            'Wood & Panels' => 'Plywood and lumber.',
            'Roofing' => 'Roof sheets and accessories.',
            'Tiles & Flooring' => 'Tiles, adhesives and grout.',
            'Electrical' => 'Wires, bulbs and electrical supplies.',
        ])->mapWithKeys(fn ($description, $name) => [$name => Category::create(['name' => $name, 'description' => $description])]);

        $brand = fn (?string $name) => $name ? Brand::firstOrCreate(['name' => $name])->id : null;

        $catalog = [
            // name, category, brand, model, sku, unit, price, stock, reorder, image, specs, featured
            ['Hollow Blocks 4"', 'Building Materials', 'Homel', 'CHB-4', 'PHLFT6R7K9W', 'pc', 21, 250, 100, 'hollow-blocks.jpg', 'Standard 4-inch concrete hollow block for walls and partitions.', true],
            ['Umbrella Roofing Nails', 'Fasteners', null, '2.5"', 'THYQCYRR4XDS', 'kg', 50, 500, 50, 'umbrella-nails.jpg', 'Galvanised umbrella-head nails for GI roofing sheets.', false],
            ['Cordless Drill 18V', 'Power Tools', 'Milwaukee', 'M18 2801-20', 'MW123456789', 'set', 1987, 4, 5, 'cordless-drill.jpeg', 'M18 18V lithium-ion battery, 1/2" chuck, two-speed transmission.', true],
            ['Tape Measure 25ft', 'Hand Tools', 'Stanley', '33-725', 'ST987654321', 'pc', 578, 100, 15, 'tape-measure.webp', '25ft nylon-coated blade with thumb lock.', false],
            ['Claw Hammer 16oz', 'Hand Tools', 'Stanley', 'Claw Hammer', 'SN987654', 'pc', 566, 55, 10, 'hammer.webp', 'Steel head with magnetic nail starter and anti-vibration grip.', true],
            ['Screwdriver Set', 'Hand Tools', 'Craftsman', '6-Piece Set', 'SN123789', 'set', 344, 55, 10, 'screwdriver-set.jpg', 'Magnetic tips, ergonomic handles, Phillips and flat heads.', false],
            ['Circular Saw Blade 7-1/4"', 'Power Tools', 'Irwin', 'TCT 7-1/4', 'SN234567', 'pc', 265, 100, 15, 'saw-blade.jpg', 'Carbide tipped, 40 teeth, for wood and plywood.', false],
            ['Portland Cement 40kg', 'Building Materials', 'Holcim', 'Type 1', 'CEM123456', 'bag', 350, 100, 30, 'cement.jpg', '40kg bag, high strength for general construction.', true],
            ['Concrete Nails 3"', 'Fasteners', 'BuildPro', 'CN-123', 'NAIL456789', 'box', 75, 200, 30, 'concrete-nails.jpg', 'Hardened steel nails for concrete and masonry.', false],
            ['PVC Pipe 2" × 10ft', 'Plumbing', 'Atlas', 'PVC-2', 'PIPE987654', 'length', 120, 200, 30, 'pvc-pipe.jpg', 'Schedule 40 sanitary pipe, 2-inch diameter.', false],
            ['All-Weather Paint (White, 4L)', 'Paint & Finishing', 'Davies', 'All-Weather', 'PAINT123456', 'gallon', 550, 300, 40, 'paint.jpg', 'Water-based acrylic, water-resistant, for exterior walls.', true],
            ['Sandpaper Fine 220 Grit', 'Paint & Finishing', '3M', 'Fine 220', 'SP123654', 'sheet', 25, 200, 50, 'sandpaper.jpg', '9 × 11 inch sheet for a smooth finish.', false],
            ['Steel Rebar 10mm × 6m', 'Building Materials', 'SteelMax', 'Rebar-10mm', 'STEEL654321', 'length', 500, 300, 50, 'steel-bars.jpg', 'Deformed steel bar, Grade 40.', false],
            ['Marine Plywood 3/4" (4×8)', 'Wood & Panels', 'Builders', 'Plywood-4x8', 'WOOD123789', 'sheet', 1200, 500, 40, 'plywood.jpg', '4 × 8 ft, 3/4 inch, moisture resistant.', true],
            ['Tile Adhesive 25kg', 'Tiles & Flooring', 'ABC', 'Fix 700', 'ADH456789', 'bag', 450, 500, 40, 'tile-adhesive.jpg', 'Strong-bond cement-based adhesive for floor and wall tiles.', false],
            ['Aluminum Ladder 12ft', 'Hand Tools', 'Werner', 'Multi-Purpose', 'LAD789654', 'pc', 2500, 3, 5, 'ladder.jpg', '12 ft multi-position, 300 lb load rating.', true],
            ['Corrugated GI Roof Sheet 12ft', 'Roofing', 'Metalink', 'Corrugated GI', 'ROOF456789', 'sheet', 1800, 100, 20, 'roof-sheet.jpg', 'Gauge 26, galvanised, 12 ft long.', false],
            ['Ceramic Floor Tiles 12×12', 'Tiles & Flooring', 'Eurotile', 'Glossy White', 'TILE123456', 'box', 750, 8, 10, 'ceramic-tiles.jpg', 'Box of 10 glossy white tiles (≈ 0.9 m²).', false],
            ['Angle Grinder 4"', 'Power Tools', 'Makita', 'GA4030', 'MAK-GA4030', 'pc', 2850, 0, 3, null, '720W motor, 11,000 rpm, includes side handle.', false],
            ['THHN Wire 3.5mm² (75m)', 'Electrical', 'Phelps Dodge', 'THHN-3.5', 'PD-THHN35', 'roll', 2450, 30, 5, null, 'Stranded copper building wire, 600V.', false],
            ['LED Bulb 9W Daylight', 'Electrical', 'Firefly', 'EBI109DL', 'FF-LED9W', 'pc', 95, 150, 30, null, 'E27 base, 6500K, 15,000-hour rated life.', false],
            ['Padlock 40mm', 'Hand Tools', 'Yale', 'Y110/40', 'YALE-Y110-40', 'pc', 385, 6, 10, null, 'Solid brass body with hardened steel shackle.', false],
        ];

        $admin = User::where('email', 'admin@hardwarehub.test')->first();
        $openedAt = Carbon::now()->subDays(60)->setTime(8, 0);

        foreach ($catalog as [$name, $category, $brandName, $model, $sku, $unit, $price, $stock, $reorder, $image, $specs, $featured]) {
            $product = Product::create([
                'name' => $name,
                'category_id' => $categories[$category]->id,
                'brand_id' => $brand($brandName),
                'model' => $model,
                'sku' => $sku,
                'unit' => $unit,
                'price' => $price,
                'cost_price' => round($price * 0.72, 2),
                'reorder_level' => $reorder,
                'description' => $specs,
                'specifications' => $specs,
                'image_path' => $image ? $this->storeImage($image) : null,
                'is_featured' => $featured,
                'is_active' => true,
            ]);

            // Opening stock is recorded in the ledger like every other change.
            $initial = $stock + $this->expectedDemoSales($stock);

            if ($initial > 0) {
                $inventory->move($product, $initial, StockMovementType::Initial, null, $admin, 'Opening stock (migrated from legacy system)')
                    ->forceFill(['created_at' => $openedAt])
                    ->saveQuietly();
            }
        }
    }

    /**
     * Fast-moving items get extra opening stock so demo sales don't empty them.
     */
    private function expectedDemoSales(int $stock): int
    {
        return $stock >= 30 ? 60 : 0;
    }

    private function storeImage(string $file): string
    {
        $path = "products/{$file}";
        Storage::disk('public')->put($path, File::get(database_path("seeders/images/{$file}")));

        return $path;
    }
}
