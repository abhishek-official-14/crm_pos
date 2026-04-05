import { useMemo } from 'react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { useAppContext } from '../context/AppContext';

const formatPeriod = (row) => {
  if (!row?._id) return '-';
  const { year, month, day } = row._id;
  if (day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
};

export default function DashboardPage() {
  const { customers, products, orders, analytics, lowStockAlerts, loading, errors, bootstrapData, exportOrdersCsv } = useAppContext();

  const totals = useMemo(
    () =>
      orders.reduce(
        (acc, order) => {
          acc.revenue += Number(order.totalAmount || 0);
          acc.tax += Number(order.taxAmount || 0);
          acc.profit += Number(order.profitAmount || 0);
          return acc;
        },
        { revenue: 0, tax: 0, profit: 0 },
      ),
    [orders],
  );

  const recentDaily = analytics.daily.slice(0, 7);
  const recentMonthly = analytics.monthly.slice(0, 6);

  if (loading.bootstrap && customers.length === 0) return <Loader label="Loading dashboard..." />;
  if (errors.bootstrap && customers.length === 0) {
    return <ErrorState message={errors.bootstrap} onRetry={bootstrapData} />;
  }

  return (
    <div className="page-grid">
      <h1>Dashboard</h1>
      {errors.bootstrap && <ErrorState message={errors.bootstrap} onRetry={bootstrapData} />}
      <div className="metrics-grid">
        <Card title="Total Customers">
          <p className="metric-value">{customers.length}</p>
        </Card>
        <Card title="Available Products">
          <p className="metric-value">{products.length}</p>
        </Card>
        <Card title="Orders">
          <p className="metric-value">{orders.length}</p>
        </Card>
        <Card title="Revenue">
          <p className="metric-value">${totals.revenue.toFixed(2)}</p>
        </Card>
        <Card title="GST Collected">
          <p className="metric-value">${totals.tax.toFixed(2)}</p>
        </Card>
        <Card title="Profit / Loss">
          <p className={`metric-value ${totals.profit < 0 ? 'danger' : 'success-text'}`}>${totals.profit.toFixed(2)}</p>
        </Card>
      </div>

      <Card title="Reports & Alerts">
        <div className="reports-row">
          <Button type="button" onClick={exportOrdersCsv} disabled={loading.exportCsv}>
            {loading.exportCsv ? 'Exporting...' : 'Export CSV Report'}
          </Button>
          {errors.exportCsv && <ErrorState message={errors.exportCsv} />}
        </div>
        <p>
          <strong>Low stock products:</strong> {lowStockAlerts.length}
        </p>
      </Card>

      <div className="two-columns page-grid">
        <Card title="Daily Analytics (last 7)">
          {loading.analytics && <Loader label="Refreshing analytics..." />}
          {errors.analytics && <ErrorState message={errors.analytics} />}
          {!loading.analytics && recentDaily.length === 0 && <p>No daily analytics yet.</p>}
          {recentDaily.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDaily.map((row) => (
                    <tr key={formatPeriod(row)}>
                      <td>{formatPeriod(row)}</td>
                      <td>{row.orders}</td>
                      <td>${Number(row.revenue || 0).toFixed(2)}</td>
                      <td>${Number(row.profit || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Monthly Analytics (last 6)">
          {!loading.analytics && recentMonthly.length === 0 && <p>No monthly analytics yet.</p>}
          {recentMonthly.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMonthly.map((row) => (
                    <tr key={formatPeriod(row)}>
                      <td>{formatPeriod(row)}</td>
                      <td>{row.orders}</td>
                      <td>${Number(row.revenue || 0).toFixed(2)}</td>
                      <td>${Number(row.profit || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
