<?php

namespace Database\Factories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Supplier>
 */
class SupplierFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->company().' Trading',
            'contact_person' => fake()->name(),
            'email' => fake()->companyEmail(),
            'phone' => '02 8'.fake()->numerify('### ####'),
            'address' => fake()->city(),
            'is_active' => true,
        ];
    }
}
