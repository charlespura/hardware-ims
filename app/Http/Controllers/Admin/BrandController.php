<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/catalog/lookups', [
            'resource' => 'brands',
            'items' => Brand::withCount('products')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Brand::create($this->validated($request));
        $this->toast('Brand added.');

        return back();
    }

    public function update(Request $request, Brand $brand): RedirectResponse
    {
        $brand->update($this->validated($request, $brand));
        $this->toast('Brand updated.');

        return back();
    }

    public function destroy(Brand $brand): RedirectResponse
    {
        $brand->delete();
        $this->toast('Brand deleted. Its products are now unbranded.', 'info');

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Brand $brand = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('brands')->ignore($brand)],
        ]);
    }
}
