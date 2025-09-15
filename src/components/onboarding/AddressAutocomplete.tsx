'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Search, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AddressAutocompleteProps {
  label: string
  value?: AddressDetails
  placeholder?: string
  error?: string
  hint?: string
  success?: string
  required?: boolean
  country?: string
  className?: string
  onAddressSelect?: (address: AddressDetails) => void
  onAddressChange?: (query: string) => void
}

interface AddressDetails {
  formatted_address: string
  street_number?: string
  route?: string
  locality: string
  administrative_area_level_2?: string
  administrative_area_level_1: string
  postal_code: string
  country: string
  place_id?: string
  lat?: number
  lng?: number
}

interface PlaceSuggestion {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  types: string[]
}

export function AddressAutocomplete({
  label,
  value,
  placeholder,
  error,
  hint,
  success,
  required = false,
  country = 'IT',
  className,
  onAddressSelect,
  onAddressChange,
}: AddressAutocompleteProps) {
  const t = useTranslations('forms.address')
  
  const [query, setQuery] = useState(value?.formatted_address || '')
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [localError, setLocalError] = useState<string>('')
  
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)
  
  const inputId = `address-${Math.random().toString(36).substr(2, 9)}`
  const hasError = !!(error || localError)
  const hasSuccess = !!success && !hasError

  // Initialize Google Places API
  useEffect(() => {
    const initializeGooglePlaces = () => {
      if (window.google?.maps?.places) {
        autocompleteService.current = new google.maps.places.AutocompleteService()
        
        // Create a hidden div for PlacesService
        const mapDiv = document.createElement('div')
        const map = new google.maps.Map(mapDiv)
        placesService.current = new google.maps.places.PlacesService(map)
      }
    }

    // Check if Google Maps API is already loaded
    if (window.google?.maps?.places) {
      initializeGooglePlaces()
    } else {
      // Wait for Google Maps API to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps?.places) {
          initializeGooglePlaces()
          clearInterval(checkGoogleMaps)
        }
      }, 100)
      
      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkGoogleMaps), 10000)
    }
  }, [])

  // Debounced search function
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    
    return (searchQuery: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        searchPlaces(searchQuery)
      }, 300)
    }
  }, [])

  // Search for place suggestions
  const searchPlaces = async (searchQuery: string) => {
    if (!searchQuery.trim() || !autocompleteService.current) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    setLocalError('')

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input: searchQuery,
        componentRestrictions: { country: country.toLowerCase() },
        types: ['address']
      }

      autocompleteService.current.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsLoading(false)
          
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions)
            setIsOpen(true)
            setSelectedIndex(-1)
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setSuggestions([])
            setIsOpen(false)
          } else {
            setLocalError(t('searchError'))
            setSuggestions([])
            setIsOpen(false)
          }
        }
      )
    } catch (err) {
      setIsLoading(false)
      setLocalError(t('searchError'))
      setSuggestions([])
      setIsOpen(false)
    }
  }

  // Get place details
  const getPlaceDetails = async (placeId: string): Promise<AddressDetails | null> => {
    if (!placesService.current) return null

    return new Promise((resolve) => {
      const request = {
        placeId,
        fields: [
          'formatted_address',
          'address_components',
          'geometry'
        ]
      }

      placesService.current!.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const addressDetails = parseAddressComponents(place)
          resolve(addressDetails)
        } else {
          resolve(null)
        }
      })
    })
  }

  // Parse address components from Google Places result
  const parseAddressComponents = (place: google.maps.places.PlaceResult): AddressDetails => {
    const components = place.address_components || []
    const details: Partial<AddressDetails> = {
      formatted_address: place.formatted_address || '',
      place_id: place.place_id,
      lat: place.geometry?.location?.lat(),
      lng: place.geometry?.location?.lng()
    }

    components.forEach((component) => {
      const types = component.types
      
      if (types.includes('street_number')) {
        details.street_number = component.long_name
      } else if (types.includes('route')) {
        details.route = component.long_name
      } else if (types.includes('locality')) {
        details.locality = component.long_name
      } else if (types.includes('administrative_area_level_2')) {
        details.administrative_area_level_2 = component.long_name
      } else if (types.includes('administrative_area_level_1')) {
        details.administrative_area_level_1 = component.long_name
      } else if (types.includes('postal_code')) {
        details.postal_code = component.long_name
      } else if (types.includes('country')) {
        details.country = component.long_name
      }
    })

    return details as AddressDetails
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    setLocalError('')
    onAddressChange?.(newQuery)
    
    if (newQuery.trim()) {
      debouncedSearch(newQuery)
    } else {
      setSuggestions([])
      setIsOpen(false)
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion: PlaceSuggestion) => {
    setQuery(suggestion.description)
    setIsOpen(false)
    setIsLoading(true)

    try {
      const addressDetails = await getPlaceDetails(suggestion.place_id)
      if (addressDetails) {
        onAddressSelect?.(addressDetails)
      } else {
        setLocalError(t('detailsError'))
      }
    } catch (err) {
      setLocalError(t('detailsError'))
    } finally {
      setIsLoading(false)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex])
        }
        break
      
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle clear
  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setIsOpen(false)
    setLocalError('')
    onAddressChange?.('')
    onAddressSelect?.(null as any)
    inputRef.current?.focus()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        listRef.current && 
        !listRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayError = error || localError
  const showClearButton = query && !isLoading

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <Label 
        htmlFor={inputId}
        className={cn(
          "text-sm font-medium",
          hasError && "text-destructive",
          hasSuccess && "text-green-600"
        )}
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label={t('required')}>
            *
          </span>
        )}
      </Label>

      {/* Input Container */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          <MapPin className="w-4 h-4" />
        </div>
        
        <Input
          ref={inputRef}
          id={inputId}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('placeholder')}
          className={cn(
            "pl-10 pr-10",
            hasError && "border-destructive focus-visible:ring-destructive",
            hasSuccess && "border-green-500 focus-visible:ring-green-500"
          )}
          aria-invalid={hasError}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="street-address"
        />

        {/* Right Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          {hasError && !isLoading && (
            <AlertCircle className="w-4 h-4 text-destructive" />
          )}
          {hasSuccess && !isLoading && (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          )}
          {showClearButton && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={handleClear}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1"
          >
            <Card className="border shadow-lg">
              <div className="max-h-60 overflow-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={cn(
                      "w-full px-3 py-2 text-left hover:bg-muted transition-colors",
                      "focus:bg-muted focus:outline-none",
                      "first:rounded-t-md last:rounded-b-md",
                      selectedIndex === index && "bg-muted"
                    )}
                    role="option"
                    aria-selected={selectedIndex === index}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {suggestion.structured_formatting.main_text}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {suggestion.structured_formatting.secondary_text}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Address Display */}
      {value && !isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 bg-muted/50 rounded-md border"
        >
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium">{value.formatted_address}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline" className="text-xs">
                  {value.postal_code} {value.locality}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {value.administrative_area_level_1}
                </Badge>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleClear}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <div className="space-y-1">
        {/* Error Message */}
        {displayError && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-destructive"
            role="alert"
          >
            {displayError}
          </motion.p>
        )}

        {/* Success Message */}
        {success && !displayError && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-green-600"
          >
            {success}
          </motion.p>
        )}

        {/* Hint */}
        {hint && !displayError && !success && (
          <p className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>

      {/* No Google Maps API Warning */}
      {typeof window !== 'undefined' && !window.google?.maps?.places && (
        <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
          {t('googleMapsRequired')}
        </p>
      )}
    </div>
  )
}