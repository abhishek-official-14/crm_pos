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
  const { products, customers, addOrder, loading, error } = useAppContext();
  const [form, setForm] = useState({ productId: '', customerId: '', quantity: 1 });
  const [query, setQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [formErrors, setFormErrors] = useState({});
  const [success, setSuccess] = useState('');

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

  const selectedProduct = products.find((item) => String(item.id) === String(form.productId));
  const total = selectedProduct ? selectedProduct.price * Number(form.quantity || 0) : 0;

  const submit = async (event) => {
    event.preventDefault();
    setSuccess('');
    const errors = {
      productId: validateRequired(form.productId, 'Product'),
      customerId: validateRequired(form.customerId, 'Customer'),
      quantity: Number(form.quantity) > 0 ? '' : 'Quantity must be greater than 0',
    };

    if (Object.values(errors).some(Boolean)) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    await addOrder({ ...form, total });
    setForm({ productId: '', customerId: '', quantity: 1 });
    setSuccess('Order placed successfully.');
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
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card title="Create Bill">
        <form className="form-grid" onSubmit={submit}>
          <Select
            label="Product"
            value={form.productId}
            onChange={(event) => setForm((prev) => ({ ...prev, productId: event.target.value }))}
            options={[{ label: 'Select product', value: '' }, ...products.map((p) => ({ label: p.name, value: p.id }))]}
            error={formErrors.productId}
          />

          <Select
            label="Customer"
            value={form.customerId}
            onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
            options={[{ label: 'Walk-in / Select customer', value: '' }, ...customers.map((c) => ({ label: c.name, value: c.id }))]}
            error={formErrors.customerId}
          />

          <Input
            type="number"
            min="1"
            label="Quantity"
            value={form.quantity}
            onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
            error={formErrors.quantity}
          />

          <p className="total-row">Total: ${total.toFixed(2)}</p>
          <Button type="submit" disabled={loading}>
            {loading ? 'Placing...' : 'Place Order'}
          </Button>
          {loading && <Loader label="Submitting order..." />}
          {error && <ErrorState message={error} />}
          {success && <div className="status success">{success}</div>}
        </form>
      </Card>
    </div>
  );
}
