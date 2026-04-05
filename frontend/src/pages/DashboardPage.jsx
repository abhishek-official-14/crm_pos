import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { useAppContext } from '../context/AppContext';

export default function DashboardPage() {
  const { customers, products, orders, loading, error, bootstrapData } = useAppContext();

  if (loading && customers.length === 0) return <Loader label="Loading dashboard..." />;
  if (error && customers.length === 0) return <ErrorState message={error} onRetry={bootstrapData} />;

  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  return (
    <div className="page-grid">
      <h1>Dashboard</h1>
      {error && <ErrorState message={error} onRetry={bootstrapData} />}
      <div className="metrics-grid">
        <Card title="Total Customers">
          <p className="metric-value">{customers.length}</p>
        </Card>
        <Card title="Available Products">
          <p className="metric-value">{products.length}</p>
        </Card>
        <Card title="Orders Today">
          <p className="metric-value">{orders.length}</p>
        </Card>
        <Card title="Revenue">
          <p className="metric-value">${revenue.toFixed(2)}</p>
        </Card>
      </div>
    </div>
  );
}
