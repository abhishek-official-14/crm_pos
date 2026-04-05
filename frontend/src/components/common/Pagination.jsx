import Button from './Button';

export default function Pagination({ page, totalPages, onChange }) {
  return (
    <div className="pagination">
      <Button variant="ghost" disabled={page === 1} onClick={() => onChange(page - 1)}>
        Prev
      </Button>
      <span>
        Page {page} of {totalPages}
      </span>
      <Button variant="ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </div>
  );
}
