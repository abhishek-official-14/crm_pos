import { useMemo, useState } from 'react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ErrorState from '../components/common/ErrorState';
import Input from '../components/common/Input';
import Loader from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import SearchFilterBar from '../components/common/SearchFilterBar';
import Select from '../components/common/Select';
import { useAppContext } from '../context/AppContext';
import usePagination from '../hooks/usePagination';
import { validateEmail, validateRequired } from '../utils/validators';

export default function CrmPage() {
  const { customers, addCustomer, loading, error } = useAppContext();
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState('all');
  const [form, setForm] = useState({ name: '', email: '', phone: '', tier: 'Bronze' });
  const [formErrors, setFormErrors] = useState({});

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        const matchesQuery = `${customer.name} ${customer.email} ${customer.phone}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesTier = tier === 'all' || customer.tier === tier;
        return matchesQuery && matchesTier;
      }),
    [customers, query, tier],
  );

  const { page, totalPages, currentItems, goToPage, setPage } = usePagination(filteredCustomers, 4);

  const handleFilterChange = (event) => {
    setTier(event.target.value);
    setPage(1);
  };

  const submit = async (event) => {
    event.preventDefault();
    const errors = {
      name: validateRequired(form.name, 'Name'),
      email: validateEmail(form.email),
      phone: validateRequired(form.phone, 'Phone'),
    };

    if (Object.values(errors).some(Boolean)) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    await addCustomer(form);
    setForm({ name: '', email: '', phone: '', tier: 'Bronze' });
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
            filter={tier}
            onFilterChange={handleFilterChange}
            filterOptions={[
              { label: 'All tiers', value: 'all' },
              { label: 'Gold', value: 'Gold' },
              { label: 'Silver', value: 'Silver' },
              { label: 'Bronze', value: 'Bronze' },
            ]}
            queryLabel="Search customers"
          />

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Tier</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.tier}</td>
                  </tr>
                ))}
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan="4">No customers found.</td>
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
          <Select
            label="Tier"
            value={form.tier}
            onChange={(event) => setForm((prev) => ({ ...prev, tier: event.target.value }))}
            options={[
              { label: 'Gold', value: 'Gold' },
              { label: 'Silver', value: 'Silver' },
              { label: 'Bronze', value: 'Bronze' },
            ]}
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Customer'}
          </Button>
          {loading && <Loader label="Saving customer..." />}
          {error && <ErrorState message={error} />}
        </form>
      </Card>
    </div>
  );
}
