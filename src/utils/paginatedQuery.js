const fetchPaginatedResults = async ({
  model,
  filter = {},
  page,
  limit,
  skip,
  sort = { createdAt: -1 },
  select,
  populate,
  lean = true
}) => {
  const query = model.find(filter).sort(sort).skip(skip).limit(limit);

  if (select) {
    query.select(select);
  }

  if (populate) {
    const populateItems = Array.isArray(populate) ? populate : [populate];
    populateItems.forEach((item) => query.populate(item));
  }

  if (lean) {
    query.lean();
  }

  const [items, total] = await Promise.all([query, model.countDocuments(filter)]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = { fetchPaginatedResults };
