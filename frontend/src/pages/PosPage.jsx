import { useMemo, useState } from 'react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ErrorState from '../components/common/ErrorState';
import Input from '../components/common/Input';
import Loader from '../components/common/Loader';
import SearchFilterBar from '../components/common/SearchFilterBar';
import Select from '../components/common/Select';
import { useAppContext } from '../context/AppContext';
import { validateRequired } from '../utils/validators';

export default function PosPage() {
  const { products, customers, addOrder, addProduct, loading, errors } = useAppContext();
  const [orderForm, setOrderForm] = useState({ productId: '', customerId: '', quantity: 1 });
  const [productForm, setProductForm] = useState({ name: '', sku: '', price: '', stock: '' });
  const [query, setQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [orderErrors, setOrderErrors] = useState({});
  const [productErrors, setProductErrors] = useState({});
  const [orderSuccess, setOrderSuccess] = useState('');
  const [productSuccess, setProductSuccess] = useState('');

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
        const matchesFilter =
          stockFilter === 'all' ||
          (stockFilter === 'in' && product.stock > 0) ||
          (stockFilter === 'low' && product.stock > 0 && product.stock <= 10);
        return matchesQuery && matchesFilter;
      }),
    [products, query, stockFilter],
  );

  const selectedProduct = products.find((item) => String(item.id) === String(orderForm.productId));
  const total = selectedProduct ? Number(selectedProduct.price) * Number(orderForm.quantity || 0) : 0;

  const submitOrder = async (event) => {
    event.preventDefault();
    setOrderSuccess('');
    const nextErrors = {
      productId: validateRequired(orderForm.productId, 'Product'),
      customerId: validateRequired(orderForm.customerId, 'Customer'),
      quantity: Number(orderForm.quantity) > 0 ? '' : 'Quantity must be greater than 0',
    };

    if (Object.values(nextErrors).some(Boolean)) {
      setOrderErrors(nextErrors);
      return;
    }

    setOrderErrors({});

    try {
      await addOrder(orderForm);
      setOrderForm({ productId: '', customerId: '', quantity: 1 });
      setOrderSuccess('Order placed successfully.');
    } catch {
      // handled by context
    }
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    setProductSuccess('');

    const nextErrors = {
      name: validateRequired(productForm.name, 'Name'),
      sku: validateRequired(productForm.sku, 'SKU'),
      price: Number(productForm.price) >= 0 ? '' : 'Price must be 0 or higher',
      stock: Number(productForm.stock) >= 0 ? '' : 'Stock must be 0 or higher',
    };

    if (Object.values(nextErrors).some(Boolean)) {
      setProductErrors(nextErrors);
      return;
    }

    setProductErrors({});

    try {
      await addProduct({
        name: productForm.name,
        sku: productForm.sku,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
      });
      setProductForm({ name: '', sku: '', price: '', stock: '' });
      setProductSuccess('Product created successfully.');
    } catch {
      // handled by context
    }
  };

  return (
    <div className="page-grid two-columns">
      <div>
        <h1>POS Billing UI</h1>
        <Card title="Product Catalog">
          <SearchFilterBar
            query={query}
            onQueryChange={(event) => setQuery(event.target.value)}
            filter={stockFilter}
            onFilterChange={(event) => setStockFilter(event.target.value)}
            filterOptions={[
              { label: 'All stock', value: 'all' },
              { label: 'In stock', value: 'in' },
              { label: 'Low stock (<=10)', value: 'low' },
            ]}
          />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>${product.price}</td>
                    <td>{product.stock}</td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="4">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="page-grid">
        <Card title="Create Bill">
          <form className="form-grid" onSubmit={submitOrder}>
            <Select
              label="Product"
              value={orderForm.productId}
              onChange={(event) => setOrderForm((prev) => ({ ...prev, productId: event.target.value }))}
              options={[
                { label: 'Select product', value: '' },
                ...products.map((p) => ({ label: p.name, value: p.id })),
              ]}
              error={orderErrors.productId}
            />

            <Select
              label="Customer"
              value={orderForm.customerId}
              onChange={(event) => setOrderForm((prev) => ({ ...prev, customerId: event.target.value }))}
              options={[
                { label: 'Select customer', value: '' },
                ...customers.map((c) => ({ label: c.name, value: c.id })),
              ]}
              error={orderErrors.customerId}
            />

            <Input
              type="number"
              min="1"
              label="Quantity"
              value={orderForm.quantity}
              onChange={(event) => setOrderForm((prev) => ({ ...prev, quantity: event.target.value }))}
              error={orderErrors.quantity}
            />

            <p className="total-row">Total: ${total.toFixed(2)}</p>
            <Button type="submit" disabled={loading.addOrder}>
              {loading.addOrder ? 'Placing...' : 'Place Order'}
            </Button>
            {loading.addOrder && <Loader label="Submitting order..." />}
            {errors.addOrder && <ErrorState message={errors.addOrder} />}
            {orderSuccess && <div className="status success">{orderSuccess}</div>}
          </form>
        </Card>

        <Card title="Add Product (Admin)">
          <form className="form-grid" onSubmit={submitProduct}>
            <Input
              label="Name"
              value={productForm.name}
              onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
              error={productErrors.name}
            />
            <Input
              label="SKU"
              value={productForm.sku}
              onChange={(event) => setProductForm((prev) => ({ ...prev, sku: event.target.value }))}
              error={productErrors.sku}
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              label="Price"
              value={productForm.price}
              onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
              error={productErrors.price}
            />
            <Input
              type="number"
              min="0"
              label="Stock"
              value={productForm.stock}
              onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))}
              error={productErrors.stock}
            />
            <Button type="submit" disabled={loading.addProduct}>
              {loading.addProduct ? 'Saving...' : 'Save Product'}
            </Button>
            {loading.addProduct && <Loader label="Saving product..." />}
            {errors.addProduct && <ErrorState message={errors.addProduct} />}
            {productSuccess && <div className="status success">{productSuccess}</div>}
          </form>
        </Card>
      </div>
    </div>
  );
}
