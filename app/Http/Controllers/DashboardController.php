<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Fortify sends everyone to /dashboard after login — route them by role.
 */
class DashboardController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        return $request->user()->isBackOffice()
            ? to_route('admin.dashboard')
            : to_route('shop.index');
    }
}
