import Input from './Input';
import Select from './Select';

export default function SearchFilterBar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  filterOptions = [],
  queryLabel = 'Search',
  showFilter = true,
}) {
  return (
    <div className="search-filter-grid">
      <Input label={queryLabel} placeholder="Type to search..." value={query} onChange={onQueryChange} />
      {showFilter && <Select label="Filter" value={filter} onChange={onFilterChange} options={filterOptions} />}
    </div>
  );
}
