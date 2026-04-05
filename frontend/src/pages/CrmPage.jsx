import { useMemo, useState } from 'react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ErrorState from '../components/common/ErrorState';
import Input from '../components/common/Input';
import Loader from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import SearchFilterBar from '../components/common/SearchFilterBar';
import { useAppContext } from '../context/AppContext';
import usePagination from '../hooks/usePagination';
import { validateEmail, validateRequired } from '../utils/validators';

export default function CrmPage() {
  const { customers, addCustomer, loading, errors } = useAppContext();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [formErrors, setFormErrors] = useState({});

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) =>
        `${customer.name} ${customer.email || ''} ${customer.phone || ''}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [customers, query],
  );

  const { page, totalPages, currentItems, goToPage, setPage } = usePagination(filteredCustomers, 4);

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {
      name: validateRequired(form.name, 'Name'),
      email: form.email ? validateEmail(form.email) : '',
      phone: validateRequired(form.phone, 'Phone'),
    };

    if (Object.values(nextErrors).some(Boolean)) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});

    try {
      await addCustomer(form);
      setForm({ name: '', email: '', phone: '' });
    } catch {
      // handled by context
    }
  };

  return (
    <div className="page-grid two-columns">
      <div>
        <h1>Customer Management</h1>
        <Card title="Customer Directory">
          <SearchFilterBar
            query={query}
            onQueryChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            filter="all"
            onFilterChange={() => {}}
            filterOptions={[{ label: 'All', value: 'all' }]}
            queryLabel="Search customers"
          />

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.email || '-'}</td>
                    <td>{customer.phone || '-'}</td>
                  </tr>
                ))}
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan="3">No customers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
        </Card>
      </div>

      <Card title="Add Customer">
        <form className="form-grid" onSubmit={submit}>
          <Input
            label="Full Name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            error={formErrors.name}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            error={formErrors.email}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            error={formErrors.phone}
          />
          <Button type="submit" disabled={loading.addCustomer}>
            {loading.addCustomer ? 'Saving...' : 'Save Customer'}
          </Button>
          {loading.addCustomer && <Loader label="Saving customer..." />}
          {errors.addCustomer && <ErrorState message={errors.addCustomer} />}
        </form>
      </Card>
    </div>
  );
}
