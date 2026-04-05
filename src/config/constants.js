const ROLES = {
    VIEWER: 'viewer',
    ANALYST: 'analyst',
    ADMIN: 'admin',
  };
  
  // Hierarchy level — higher = more permissions
  const ROLE_LEVELS = {
    [ROLES.VIEWER]: 1,
    [ROLES.ANALYST]: 2,
    [ROLES.ADMIN]: 3,
  };
  
  const TRANSACTION_TYPES = {
    INCOME: 'income',
    EXPENSE: 'expense',
  };
  
  const TRANSACTION_CATEGORIES = [
    'salary',
    'freelance',
    'investment',
    'rental',
    'business',
    'food',
    'transport',
    'utilities',
    'entertainment',
    'healthcare',
    'education',
    'shopping',
    'travel',
    'insurance',
    'taxes',
    'other',
  ];
  
  const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  };
  
  const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  };
  
  module.exports = {
    ROLES,
    ROLE_LEVELS,
    TRANSACTION_TYPES,
    TRANSACTION_CATEGORIES,
    USER_STATUS,
    PAGINATION,
  };