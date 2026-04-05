import Input from './Input';
import Select from './Select';

export default function SearchFilterBar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  filterOptions,
  queryLabel = 'Search',
}) {
  return (
    <div className="search-filter-grid">
      <Input label={queryLabel} placeholder="Type to search..." value={query} onChange={onQueryChange} />
      <Select label="Filter" value={filter} onChange={onFilterChange} options={filterOptions} />
    </div>
  );
}
