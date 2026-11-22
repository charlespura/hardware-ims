<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\VoucherRequest;
use App\Models\Voucher;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class VoucherController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/vouchers/index', [
            'vouchers' => Voucher::latest()->get()->map(fn (Voucher $v) => [...$v->toArray(), 'summary' => $v->summary()]),
        ]);
    }

    public function store(VoucherRequest $request): RedirectResponse
    {
        Voucher::create([...$request->validated(), 'value' => $request->validated('value') ?? 0]);
        $this->toast('Voucher created.');

        return back();
    }

    public function update(VoucherRequest $request, Voucher $voucher): RedirectResponse
    {
        $voucher->update([...$request->validated(), 'value' => $request->validated('value') ?? 0]);
        $this->toast('Voucher updated.');

        return back();
    }

    public function destroy(Voucher $voucher): RedirectResponse
    {
        if ($voucher->orders()->exists()) {
            $voucher->update(['is_active' => false]);
            $this->toast('This voucher has been used, so it was deactivated instead of deleted.', 'info');

            return back();
        }

        $voucher->delete();
        $this->toast('Voucher deleted.', 'info');

        return back();
    }
}
