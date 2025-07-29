class PaginationHelper {
  static getOffset(page, limit) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20)); // Max 100 items per page
    return {
      offset: (pageNum - 1) * limitNum,
      limit: limitNum,
      page: pageNum
    };
  }

  static formatResponse(data, total, page, limit) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const totalPages = Math.ceil(total / limitNum);
    
    return {
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: parseInt(total),
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
        nextPage: pageNum < totalPages ? pageNum + 1 : null,
        prevPage: pageNum > 1 ? pageNum - 1 : null
      }
    };
  }

  static addPaginationToQuery(query, offset, limit) {
    return `${query} LIMIT $${offset + 1} OFFSET $${offset + 2}`;
  }
}

export default PaginationHelper;