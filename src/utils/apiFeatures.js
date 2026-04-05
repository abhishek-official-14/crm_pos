/**
 * Utility helper for API-level pagination and search.
 */
const buildQueryFeatures = ({ query = {}, searchableFields = [] }) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const searchValue = query.search ? String(query.search).trim() : '';
  const search = searchValue
    ? {
        $or: searchableFields.map((field) => ({
          [field]: { $regex: searchValue, $options: 'i' }
        }))
      }
    : {};

  return { page, limit, skip, search };
};

module.exports = { buildQueryFeatures };
