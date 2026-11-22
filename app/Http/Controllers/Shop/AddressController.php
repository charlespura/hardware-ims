<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\AddressRequest;
use App\Models\Address;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AddressController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('settings/addresses', [
            'addresses' => $request->user()->addresses()->orderByDesc('is_default')->latest()->get(),
        ]);
    }

    public function store(AddressRequest $request): RedirectResponse
    {
        $user = $request->user();

        DB::transaction(function () use ($request, $user) {
            $makeDefault = $request->boolean('is_default') || ! $user->addresses()->exists();

            if ($makeDefault) {
                $user->addresses()->update(['is_default' => false]);
            }

            $user->addresses()->create([...$request->validated(), 'is_default' => $makeDefault]);
        });

        $this->toast('Address saved.');

        return back();
    }

    public function update(AddressRequest $request, Address $address): RedirectResponse
    {
        $this->authorizeOwner($request, $address);

        DB::transaction(function () use ($request, $address) {
            if ($request->boolean('is_default')) {
                $request->user()->addresses()->whereKeyNot($address->id)->update(['is_default' => false]);
            }

            $address->update([...$request->validated(), 'is_default' => $request->boolean('is_default') || $address->is_default]);
        });

        $this->toast('Address updated.');

        return back();
    }

    public function makeDefault(Request $request, Address $address): RedirectResponse
    {
        $this->authorizeOwner($request, $address);

        DB::transaction(function () use ($request, $address) {
            $request->user()->addresses()->update(['is_default' => false]);
            $address->update(['is_default' => true]);
        });

        return back();
    }

    public function destroy(Request $request, Address $address): RedirectResponse
    {
        $this->authorizeOwner($request, $address);

        $address->delete();

        if ($address->is_default) {
            $request->user()->addresses()->latest()->first()?->update(['is_default' => true]);
        }

        $this->toast('Address removed.', 'info');

        return back();
    }

    private function authorizeOwner(Request $request, Address $address): void
    {
        abort_unless($address->user_id === $request->user()->id, 404);
    }
}
