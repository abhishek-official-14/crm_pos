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
  const { products, customers, addOrder, addProduct, lowStockAlerts, downloadInvoicePdf, loading, errors } = useAppContext();
  const [orderForm, setOrderForm] = useState({ productId: '', customerId: '', quantity: 1, gstRate: 18 });
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    price: '',
    costPrice: '',
    stock: '',
    lowStockThreshold: '10',
  });
  const [query, setQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [orderErrors, setOrderErrors] = useState({});
  const [productErrors, setProductErrors] = useState({});
  const [orderSuccess, setOrderSuccess] = useState('');
  const [productSuccess, setProductSuccess] = useState('');
  const [latestOrderId, setLatestOrderId] = useState('');

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const queryLC = query.toLowerCase();
        const matchesQuery =
          product.name.toLowerCase().includes(queryLC) ||
          String(product.sku || '')
            .toLowerCase()
            .includes(queryLC);
        const threshold = product.lowStockThreshold ?? 10;
        const matchesFilter =
          stockFilter === 'all' ||
          (stockFilter === 'in' && product.stock > threshold) ||
          (stockFilter === 'low' && product.stock > 0 && product.stock <= threshold) ||
          (stockFilter === 'out' && product.stock === 0);
        return matchesQuery && matchesFilter;
      }),
    [products, query, stockFilter],
  );

  const selectedProduct = products.find((item) => String(item.id) === String(orderForm.productId));
  const subtotal = selectedProduct ? Number(selectedProduct.price) * Number(orderForm.quantity || 0) : 0;
  const gstAmount = subtotal * (Number(orderForm.gstRate || 0) / 100);
  const total = subtotal + gstAmount;

  const submitOrder = async (event) => {
    event.preventDefault();
    setOrderSuccess('');
    const nextErrors = {
      productId: validateRequired(orderForm.productId, 'Product'),
      customerId: validateRequired(orderForm.customerId, 'Customer'),
      quantity: Number(orderForm.quantity) > 0 ? '' : 'Quantity must be greater than 0',
      gstRate: Number(orderForm.gstRate) >= 0 ? '' : 'GST must be 0 or higher',
    };

    if (Object.values(nextErrors).some(Boolean)) {
      setOrderErrors(nextErrors);
      return;
    }

    setOrderErrors({});

    try {
      const order = await addOrder(orderForm);
      setLatestOrderId(order.id);
      setOrderForm({ productId: '', customerId: '', quantity: 1, gstRate: orderForm.gstRate });
      setOrderSuccess('Order placed successfully. Inventory and analytics updated.');
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
      costPrice: Number(productForm.costPrice) >= 0 ? '' : 'Cost price must be 0 or higher',
      stock: Number(productForm.stock) >= 0 ? '' : 'Stock must be 0 or higher',
      lowStockThreshold: Number(productForm.lowStockThreshold) >= 0 ? '' : 'Threshold must be 0 or higher',
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
        costPrice: Number(productForm.costPrice),
        stock: Number(productForm.stock),
        lowStockThreshold: Number(productForm.lowStockThreshold),
      });
      setProductForm({ name: '', sku: '', price: '', costPrice: '', stock: '', lowStockThreshold: '10' });
      setProductSuccess('Product created successfully.');
    } catch {
      // handled by context
    }
  };

  return (
    <div className="page-grid two-columns">
      <div>
        <h1>POS Billing UI</h1>
        {lowStockAlerts.length > 0 && (
          <div className="status warning">
            <div>
              <strong>Low stock alerts:</strong> {lowStockAlerts.map((item) => `${item.name} (${item.stock})`).join(', ')}
            </div>
          </div>
        )}
        <Card title="Product Catalog">
          <SearchFilterBar
            query={query}
            onQueryChange={(event) => setQuery(event.target.value)}
            filter={stockFilter}
            onFilterChange={(event) => setStockFilter(event.target.value)}
            filterOptions={[
              { label: 'All stock', value: 'all' },
              { label: 'In stock', value: 'in' },
              { label: 'Low stock', value: 'low' },
              { label: 'Out of stock', value: 'out' },
            ]}
          />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Cost</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className={product.stock <= (product.lowStockThreshold ?? 10) ? 'row-low-stock' : ''}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td>${Number(product.costPrice || 0).toFixed(2)}</td>
                    <td>{product.stock}</td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="5">No products found.</td>
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

            <Input
              type="number"
              min="0"
              step="0.01"
              label="GST %"
              value={orderForm.gstRate}
              onChange={(event) => setOrderForm((prev) => ({ ...prev, gstRate: event.target.value }))}
              error={orderErrors.gstRate}
            />

            <div className="totals-stack">
              <p className="total-row">Subtotal: ${subtotal.toFixed(2)}</p>
              <p className="total-row">GST: ${gstAmount.toFixed(2)}</p>
              <p className="total-row">Grand Total: ${total.toFixed(2)}</p>
            </div>
            <Button type="submit" disabled={loading.addOrder}>
              {loading.addOrder ? 'Placing...' : 'Place Order'}
            </Button>
            {latestOrderId && (
              <Button type="button" onClick={() => downloadInvoicePdf(latestOrderId)}>
                Download Invoice PDF
              </Button>
            )}
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
              step="0.01"
              label="Cost Price"
              value={productForm.costPrice}
              onChange={(event) => setProductForm((prev) => ({ ...prev, costPrice: event.target.value }))}
              error={productErrors.costPrice}
            />
            <Input
              type="number"
              min="0"
              label="Stock"
              value={productForm.stock}
              onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))}
              error={productErrors.stock}
            />
            <Input
              type="number"
              min="0"
              label="Low Stock Threshold"
              value={productForm.lowStockThreshold}
              onChange={(event) => setProductForm((prev) => ({ ...prev, lowStockThreshold: event.target.value }))}
              error={productErrors.lowStockThreshold}
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
