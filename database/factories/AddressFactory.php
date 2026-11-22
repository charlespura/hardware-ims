<?php

namespace Database\Factories;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Address>
 */
class AddressFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'label' => 'Home',
            'recipient_name' => fake()->name(),
            'phone' => '0917'.fake()->numerify('#######'),
            'street' => fake()->buildingNumber().' '.fake()->streetName(),
            'barangay' => 'Brgy. '.fake()->lastName(),
            'city' => fake()->randomElement(['Quezon City', 'Manila', 'Makati', 'Pasig', 'Caloocan', 'Marikina']),
            'province' => 'Metro Manila',
            'postal_code' => fake()->numerify('1###'),
            'is_default' => true,
        ];
    }
}
