/**
 * Translation fallback utilities for graceful handling of missing translation keys
 */

export function createTranslationFallback(baseKey: string) {
  const lastPart = baseKey.split('.').pop() || 'Unknown'
  return {
    title: `${lastPart} (Translation Missing)`,
    label: `${lastPart} Label`,
    placeholder: `Enter ${lastPart.toLowerCase()}`,
    description: `${lastPart} description`,
    hint: `Help text for ${lastPart.toLowerCase()}`,
    required: 'Required',
    optional: 'Optional'
  }
}

export function getTranslationFallback(key: string): string {
  const parts = key.split('.')
  const lastPart = parts[parts.length - 1]

  // Common fallbacks based on key patterns
  const fallbacks: Record<string, string> = {
    'title': `${lastPart} Title`,
    'label': `${lastPart} Label`,
    'placeholder': `Enter ${lastPart.toLowerCase()}`,
    'description': `${lastPart} description`,
    'hint': `Help text for ${lastPart.toLowerCase()}`,
    'required': 'Required',
    'optional': 'Optional',
    'add': 'Add',
    'remove': 'Remove',
    'addButton': 'Add Item',
    'empty': 'No items',
    'duplicate': 'Item already exists',
    'invalid': 'Invalid value',
    'checking': 'Checking...',
    'valid': 'Valid',
    'taken': 'Already in use',
    'loading': 'Loading...',
    'search': 'Search...',
    'noResults': 'No results found',
    'selectFromList': 'Select from list',
    'searching': 'Searching...',
    'googleMapsRequired': 'Google Maps API required',
    'characterMinimum': `Must be at least {count} characters`,
    'characterMaximum': `Must be no more than {count} characters`
  }

  // Return fallback or a generic message
  return fallbacks[lastPart] || `${lastPart.charAt(0).toUpperCase() + lastPart.slice(1)} (Missing Translation)`
}