<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Shop\AddressController;
use App\Http\Controllers\Shop\CartController;
use App\Http\Controllers\Shop\CheckoutController;
use App\Http\Controllers\Shop\HomeController;
use App\Http\Controllers\Shop\OrderController;
use App\Http\Controllers\Shop\ProductController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Storefront (public)
|--------------------------------------------------------------------------
*/

Route::get('/', HomeController::class)->name('home');
Route::get('shop', [ProductController::class, 'index'])->name('shop.index');
Route::get('shop/{product:slug}', [ProductController::class, 'show'])->name('shop.show');

/*
|--------------------------------------------------------------------------
| Signed-in users
|--------------------------------------------------------------------------
*/

Route::middleware('auth')->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Receipts are shared by customers (their own orders) and staff.
    Route::get('orders/{order}/receipt', [OrderController::class, 'receipt'])->name('orders.receipt');

    Route::middleware('role:customer')->group(function () {
        Route::get('cart', [CartController::class, 'index'])->name('cart.index');
        Route::post('cart', [CartController::class, 'store'])->name('cart.store');
        Route::patch('cart/{cartItem}', [CartController::class, 'update'])->name('cart.update');
        Route::delete('cart/{cartItem}', [CartController::class, 'destroy'])->name('cart.destroy');
        Route::post('cart/voucher', [CartController::class, 'applyVoucher'])->name('cart.voucher.apply');
        Route::delete('cart/voucher', [CartController::class, 'removeVoucher'])->name('cart.voucher.remove');

        Route::get('checkout', [CheckoutController::class, 'create'])->name('checkout.create');
        Route::post('checkout', [CheckoutController::class, 'store'])->middleware('throttle:10,1')->name('checkout.store');

        Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
        Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
        Route::post('orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
        Route::post('orders/{order}/payment-proof', [OrderController::class, 'uploadProof'])->name('orders.payment-proof');
        Route::post('orders/{order}/reorder', [OrderController::class, 'reorder'])->name('orders.reorder');

        Route::get('settings/addresses', [AddressController::class, 'index'])->name('addresses.index');
        Route::post('settings/addresses', [AddressController::class, 'store'])->name('addresses.store');
        Route::put('settings/addresses/{address}', [AddressController::class, 'update'])->name('addresses.update');
        Route::post('settings/addresses/{address}/default', [AddressController::class, 'makeDefault'])->name('addresses.make-default');
        Route::delete('settings/addresses/{address}', [AddressController::class, 'destroy'])->name('addresses.destroy');
    });
});

require __DIR__.'/admin.php';
require __DIR__.'/settings.php';
