// backend/utils/helpers.js

/**
 * Validates a value against a list of allowed values
 * @param {any} value - The value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @param {string} [defaultValue] - Default value if invalid
 * @returns {any} - Valid value or default
 */
const validateEnum = (value, allowedValues, defaultValue = null) => {
  if (value && allowedValues.includes(value)) {
    return value;
  }
  return defaultValue;
};

/**
 * Format date string to ISO format
 * @param {string|Date} date - Date to format
 * @returns {string} - ISO date string
 */
const formatDate = (date) => {
  if (!date) return null;
  
  try {
    return new Date(date).toISOString();
  } catch (error) {
    return null;
  }
};

/**
 * Builds a dynamic SQL update query
 * @param {Object} updates - Object with field-value pairs to update
 * @returns {Object} - Object with updates array and values array
 */
const buildUpdateQuery = (updates) => {
  const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
  const values = fields.map(field => updates[field]);
  
  if (fields.length === 0) {
    return { fields: [], values: [] };
  }
  
  const updateClause = fields.map(field => `${field} = ?`).join(', ');
  
  return {
    updateClause,
    values
  };
};

/**
 * Filter object properties
 * @param {Object} obj - Object to filter
 * @param {Array} allowedProps - Allowed property names
 * @returns {Object} - Filtered object
 */
const filterObject = (obj, allowedProps) => {
  return Object.keys(obj)
    .filter(key => allowedProps.includes(key))
    .reduce((newObj, key) => {
      newObj[key] = obj[key];
      return newObj;
    }, {});
};

module.exports = {
  validateEnum,
  formatDate,
  buildUpdateQuery,
  filterObject
};
