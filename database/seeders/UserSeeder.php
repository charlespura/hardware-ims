<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Demo accounts — every password is "password".
     */
    public function run(): void
    {
        $this->account('Andrea Lim', 'admin@hardwarehub.test', Role::Admin, '09170000001');
        $this->account('Maria Santos', 'staff@hardwarehub.test', Role::Staff, '09170000002');

        $juan = $this->account('Juan Dela Cruz', 'customer@hardwarehub.test', Role::Customer, '09171234567');
        Address::factory()->for($juan)->create([
            'label' => 'Home',
            'recipient_name' => 'Juan Dela Cruz',
            'phone' => '09171234567',
            'street' => '502 Mabini Street',
            'barangay' => 'Brgy. San Roque',
            'city' => 'Quezon City',
            'province' => 'Metro Manila',
            'postal_code' => '1109',
        ]);
        Address::factory()->for($juan)->create([
            'label' => 'Site office',
            'recipient_name' => 'Juan Dela Cruz',
            'phone' => '09171234567',
            'street' => 'Lot 12 Sampaguita Road',
            'barangay' => 'Brgy. Pinagbuhatan',
            'city' => 'Pasig',
            'province' => 'Metro Manila',
            'postal_code' => '1601',
            'is_default' => false,
        ]);

        $names = ['Ana Reyes', 'Mark Bautista', 'Carlo Garcia', 'Liza Mendoza', 'Paolo Ramos', 'Jasmine Cruz', 'Miguel Torres', 'Grace Villanueva', 'Rico Aquino', 'Bea Fernandez'];

        foreach ($names as $i => $name) {
            $user = $this->account($name, strtolower(str_replace(' ', '.', $name)).'@example.com', Role::Customer, sprintf('0918%07d', $i + 100));
            Address::factory()->for($user)->create(['recipient_name' => $name, 'phone' => $user->phone]);
        }
    }

    private function account(string $name, string $email, Role $role, string $phone): User
    {
        $user = new User;
        $user->forceFill([
            'name' => $name,
            'email' => $email,
            'role' => $role,
            'phone' => $phone,
            'password' => 'password',
            'email_verified_at' => now(),
        ])->save();

        return $user;
    }
}
