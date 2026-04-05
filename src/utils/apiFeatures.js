/**
 * Utility helpers for API-level pagination and search.
 */
const env = require('../config/env');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSearchQuery = ({ searchTerm = '', searchableFields = [] }) => {
  if (!searchTerm || searchableFields.length === 0) return {};

  const escapedSearchTerm = escapeRegex(searchTerm);
  return {
    $or: searchableFields.map((field) => ({
      [field]: { $regex: escapedSearchTerm, $options: 'i' }
    }))
  };
};

const buildQueryFeatures = ({ query = {}, searchableFields = [] }) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const searchTerm = query.search ? String(query.search).trim().slice(0, env.maxSearchLength) : '';
  const search = buildSearchQuery({ searchTerm, searchableFields });

  return { page, limit, skip, search, searchTerm };
};

module.exports = { buildQueryFeatures, buildSearchQuery };
