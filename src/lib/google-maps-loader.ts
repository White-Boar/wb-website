/**
 * Google Maps API Loader
 *
 * Loads the Google Maps JavaScript API with Places library
 * Handles API key from environment variables
 * Provides loading state and error handling
 */

let isLoading = false
let isLoaded = false
let loadError: Error | null = null

export interface GoogleMapsLoaderOptions {
  apiKey?: string
  libraries?: string[]
  language?: string
}

/**
 * Load Google Maps JavaScript API
 * Returns a promise that resolves when the API is loaded
 */
export function loadGoogleMapsAPI(options: GoogleMapsLoaderOptions = {}): Promise<void> {
  // If already loaded, resolve immediately
  if (isLoaded && (window as any).google?.maps?.places) {
    return Promise.resolve()
  }

  // If there was a previous error, reject with that error
  if (loadError) {
    return Promise.reject(loadError)
  }

  // If currently loading, wait for the existing load
  if (isLoading) {
    return new Promise((resolve, reject) => {
      const checkLoaded = setInterval(() => {
        if (isLoaded) {
          clearInterval(checkLoaded)
          resolve()
        } else if (loadError) {
          clearInterval(checkLoaded)
          reject(loadError)
        }
      }, 100)

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkLoaded)
        reject(new Error('Google Maps API load timeout'))
      }, 10000)
    })
  }

  const {
    apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries = ['places'],
    language = 'en'
  } = options

  // If no API key, don't load (will fallback to manual entry)
  if (!apiKey) {
    const error = new Error('Google Maps API key not configured')
    loadError = error
    return Promise.reject(error)
  }

  isLoading = true

  return new Promise((resolve, reject) => {
    try {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        // Wait for it to load
        existingScript.addEventListener('load', () => {
          isLoaded = true
          isLoading = false
          resolve()
        })
        existingScript.addEventListener('error', (error) => {
          isLoading = false
          loadError = new Error('Failed to load Google Maps API')
          reject(loadError)
        })
        return
      }

      // Create script element
      const script = document.createElement('script')
      const librariesParam = libraries.join(',')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${librariesParam}&language=${language}`
      script.async = true
      script.defer = true

      script.onload = () => {
        isLoaded = true
        isLoading = false
        resolve()
      }

      script.onerror = () => {
        isLoading = false
        loadError = new Error('Failed to load Google Maps API')
        reject(loadError)
      }

      document.head.appendChild(script)
    } catch (error) {
      isLoading = false
      loadError = error as Error
      reject(error)
    }
  })
}

/**
 * Check if Google Maps API is loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return !!(window as any).google?.maps?.places
}

/**
 * Get the current load state
 */
export function getLoadState(): { isLoading: boolean; isLoaded: boolean; error: Error | null } {
  return {
    isLoading,
    isLoaded: isLoaded && isGoogleMapsLoaded(),
    error: loadError
  }
}
