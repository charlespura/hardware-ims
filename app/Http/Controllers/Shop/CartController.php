<?php

namespace App\Http\Controllers\Shop;

use App\Enums\FulfillmentMethod;
use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use App\Services\PricingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(private readonly PricingService $pricing) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $items = $this->items($user);
        $voucher = $this->pricing->findVoucher($request->session()->get('voucher_code'));
        $quote = $this->pricing->quote(self::lines($items), FulfillmentMethod::Delivery, $voucher, $user);

        if ($voucher && $quote->voucherError) {
            $request->session()->forget('voucher_code');
        }

        return Inertia::render('cart/index', [
            'items' => $items->map(fn (CartItem $item) => [
                'id' => $item->id,
                'quantity' => $item->quantity,
                'issue' => self::issueFor($item),
                'product' => $item->product,
            ])->values(),
            'quote' => $quote->toArray(),
            'canCheckout' => $items->isNotEmpty() && $items->every(fn (CartItem $i) => self::issueFor($i) === null),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:999'],
        ]);

        $product = Product::active()->findOrFail($request->integer('product_id'));
        $item = $request->user()->cartItems()->firstOrNew(['product_id' => $product->id]);
        $quantity = ($item->quantity ?? 0) + $request->integer('quantity');

        $this->assertStock($product, $quantity, $item->quantity ?? 0);

        $item->fill(['quantity' => $quantity])->save();

        $this->toast("Added {$request->integer('quantity')} × {$product->name} to your cart.");

        return back();
    }

    public function update(Request $request, CartItem $cartItem): RedirectResponse
    {
        abort_unless($cartItem->user_id === $request->user()->id, 404);

        $request->validate(['quantity' => ['required', 'integer', 'min:1', 'max:999']]);

        $this->assertStock($cartItem->product, $request->integer('quantity'));

        $cartItem->update(['quantity' => $request->integer('quantity')]);

        return back();
    }

    public function destroy(Request $request, CartItem $cartItem): RedirectResponse
    {
        abort_unless($cartItem->user_id === $request->user()->id, 404);

        $cartItem->delete();

        $this->toast('Item removed from your cart.', 'info');

        return back();
    }

    public function applyVoucher(Request $request): RedirectResponse
    {
        $data = $request->validate(['voucher_code' => ['required', 'string', 'max:40']]);
        $voucher = $this->pricing->findVoucher($data['voucher_code']);

        if (! $voucher) {
            throw ValidationException::withMessages(['voucher_code' => 'That voucher code does not exist.']);
        }

        $user = $request->user();
        $subtotal = $this->pricing->quote(self::lines($this->items($user)), FulfillmentMethod::Delivery)->subtotal;

        if ($error = $this->pricing->voucherError($voucher, $subtotal, FulfillmentMethod::Delivery, $user)) {
            throw ValidationException::withMessages(['voucher_code' => $error]);
        }

        $request->session()->put('voucher_code', $voucher->code);
        $this->toast("Voucher {$voucher->code} applied: {$voucher->summary()}.");

        return back();
    }

    public function removeVoucher(Request $request): RedirectResponse
    {
        $request->session()->forget('voucher_code');

        return back();
    }

    /**
     * @return Collection<int, CartItem>
     */
    private function items(User $user): Collection
    {
        return $user->cartItems()
            ->with(['product' => fn ($q) => $q->select([...ProductController::PUBLIC_COLUMNS, 'is_active'])->with('category:id,name,slug')])
            ->latest()
            ->get()
            ->filter(fn (CartItem $item) => $item->product !== null)
            ->values();
    }

    /**
     * @param  Collection<int, CartItem>  $items
     * @return Collection<int, array{price: string, quantity: int}>
     */
    public static function lines(Collection $items): Collection
    {
        return $items
            ->filter(fn (CartItem $i) => self::issueFor($i) !== 'unavailable')
            ->map(fn (CartItem $i) => ['price' => $i->product->price, 'quantity' => $i->quantity]);
    }

    public static function issueFor(CartItem $item): ?string
    {
        return match (true) {
            ! $item->product->is_active => 'unavailable',
            $item->product->stock === 0 => 'out_of_stock',
            $item->product->stock < $item->quantity => 'insufficient',
            default => null,
        };
    }

    private function assertStock(Product $product, int $wanted, int $alreadyInCart = 0): void
    {
        if ($wanted > $product->stock) {
            $left = max(0, $product->stock - $alreadyInCart);

            throw ValidationException::withMessages([
                'quantity' => match (true) {
                    $product->stock === 0 => "{$product->name} is out of stock.",
                    $alreadyInCart > 0 => "You already have {$alreadyInCart} in your cart — only {$left} more available.",
                    default => "Only {$product->stock} {$product->unit} available.",
                },
            ]);
        }
    }
}
