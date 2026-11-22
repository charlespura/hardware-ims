<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        $price = fake()->randomFloat(2, 50, 3000);

        return [
            'category_id' => Category::factory(),
            'name' => ucfirst(fake()->unique()->word()).' '.fake()->randomElement(['Drill', 'Hammer', 'Wrench', 'Saw', 'Pliers', 'Level', 'Chisel']),
            'sku' => strtoupper(fake()->unique()->bothify('SKU-####-??')),
            'model' => strtoupper(fake()->bothify('??-###')),
            'description' => fake()->sentence(12),
            'unit' => 'pc',
            'cost_price' => round($price * 0.7, 2),
            'price' => $price,
            'stock' => 50,
            'reorder_level' => 10,
            'is_active' => true,
        ];
    }

    public function stock(int $stock): static
    {
        return $this->state(fn () => ['stock' => $stock]);
    }

    public function price(float $price): static
    {
        return $this->state(fn () => ['price' => $price, 'cost_price' => round($price * 0.7, 2)]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
