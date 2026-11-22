<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed a complete demo store: catalog, people, suppliers and
     * ~6 weeks of order history so every screen has data.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CatalogSeeder::class,
            StoreSetupSeeder::class,
            DemoActivitySeeder::class,
        ]);
    }
}
