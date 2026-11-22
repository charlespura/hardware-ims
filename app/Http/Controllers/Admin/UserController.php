<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::enum(Role::class)],
        ]);

        return Inertia::render('admin/users/index', [
            'users' => User::query()
                ->withCount('orders')
                ->withSum(['orders as total_spent' => fn ($q) => $q->revenue()], 'total')
                ->when($filters['role'] ?? null, fn ($q, $role) => $q->where('role', $role))
                ->when($filters['search'] ?? null, fn ($q, $term) => $q->where(fn ($q) => $q
                    ->where('name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%")))
                ->latest()
                ->paginate(15)
                ->withQueryString(),
            'counts' => User::toBase()->selectRaw('role, COUNT(*) as aggregate')->groupBy('role')->pluck('aggregate', 'role'),
            'filters' => [
                'search' => $filters['search'] ?? '',
                'role' => $filters['role'] ?? '',
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'regex:/^(09|\+639)\d{9}$/'],
            'role' => ['required', Rule::enum(Role::class)],
            'password' => ['required', Password::defaults()],
        ]);

        $user = (new User)->forceFill([...$data, 'email_verified_at' => now()]);
        $user->save();

        $this->toast("{$user->name} can now sign in as {$user->role->label()}.");

        return back();
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'regex:/^(09|\+639)\d{9}$/'],
            'role' => ['required', Rule::enum(Role::class)],
            'is_active' => ['boolean'],
        ]);

        if ($user->is($request->user()) && ($data['role'] !== $user->role->value || ! ($data['is_active'] ?? true))) {
            $this->toast('You cannot change your own role or deactivate your own account.', 'error');

            return back();
        }

        $user->forceFill($data)->save();
        $this->toast('User updated.');

        return back();
    }
}
