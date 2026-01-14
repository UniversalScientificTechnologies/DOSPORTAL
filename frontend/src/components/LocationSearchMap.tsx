import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { theme } from '../theme'
import 'leaflet/dist/leaflet.css'

interface LocationSearchMapProps {
  onLocationSelect: (data: {
    latitude: number
    longitude: number
    location_text: string
  }) => void
  initialLat?: number
  initialLng?: number
  initialLocationText?: string
}

interface SearchResult {
  id: number
  display_name: string
  lat: string
  lon: string
}

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export const LocationSearchMap = ({
  onLocationSelect,
  initialLat,
  initialLng,
  initialLocationText,
}: LocationSearchMapProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
    name: string
  } | null>(
    initialLat && initialLng && initialLocationText
      ? { lat: initialLat, lng: initialLng, name: initialLocationText }
      : null
  )
  const [searching, setSearching] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  // Debounced search - wait for user to stop typing before searching
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
        )
        if (!response.ok) throw new Error('Search failed')
        const results = await response.json()
        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 600) // Wait 600ms

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Update map when initialLat/initialLng change
  useEffect(() => {
    if (initialLat && initialLng && mapRef.current) {
      mapRef.current.setView([initialLat, initialLng], 13)
      
      // Reverse geocode to get location name from coordinates
      const fetchLocationName = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${initialLat}&lon=${initialLng}`
          )
          if (!response.ok) throw new Error('Reverse geocoding failed')
          const data = await response.json()
          const locationName = data.address?.name || data.display_name || ''
          
          setSelectedLocation({
            lat: initialLat,
            lng: initialLng,
            name: locationName,
          })
        } catch (error) {
          console.error('Reverse geocoding error:', error)
          // If reverse geocoding fails, just use coordinates
          setSelectedLocation({
            lat: initialLat,
            lng: initialLng,
            name: initialLocationText || `${initialLat.toFixed(4)}, ${initialLng.toFixed(4)}`,
          })
        }
      }
      
      fetchLocationName()
    }
  }, [initialLat, initialLng, initialLocationText])

  const handleSelectResult = (result: SearchResult) => {
    // Immediately clear search results and query to hide dropdown
    setSearchQuery('')
    setSearchResults([])
    setIsCollapsed(false)

    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    const locationName = result.display_name

    setSelectedLocation({
      lat,
      lng,
      name: locationName,
    })

    // Pan map to new location
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 13)
    }
  }

  // When selectedLocation changes from map interaction, show Selected Location Info again
  useEffect(() => {
    if (selectedLocation && isCollapsed) {
      setIsCollapsed(false)
    }
  }, [selectedLocation?.lat, selectedLocation?.lng])

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      setIsCollapsed(true)
      onLocationSelect({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        location_text: selectedLocation.name,
      })
    }
  }

  const defaultLat = selectedLocation?.lat ?? initialLat ?? 49.8175
  const defaultLng = selectedLocation?.lng ?? initialLng ?? 15.473
  const defaultZoom = selectedLocation ? 13 : 5

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Search Input */}
      <div style={{ display: 'flex', gap: theme.spacing.sm }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
            placeholder="Search for a place..."
            style={{
              width: '100%',
              padding: theme.spacing.sm,
              border: `${theme.borders.width} solid ${theme.colors.border}`,
              borderRadius: theme.borders.radius.sm,
              fontSize: theme.typography.fontSize.base,
              background: theme.colors.bg,
              color: theme.colors.textDark,
            }}
          />
          {searching && (
            <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.muted, marginTop: theme.spacing.xs, marginBottom: 0 }}>
              Searching...
            </p>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {searchResults.length > 0 && (
        <div
          style={{
            border: `${theme.borders.width} solid ${theme.colors.border}`,
            borderRadius: theme.borders.radius.sm,
            maxHeight: '200px',
            overflowY: 'auto',
            background: theme.colors.bg,
            boxShadow: theme.shadows.sm,
            zIndex: 10,
            position: 'relative',
          }}
        >
          {searchResults.map((result) => (
            <div
              key={result.id}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelectResult(result)
              }}
              style={{
                padding: theme.spacing.sm,
                borderBottom: `${theme.borders.width} solid ${theme.colors.mutedLighter}`,
                cursor: 'pointer',
                transition: theme.transitions.fast,
                background: theme.colors.bg,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.bg
              }}
            >
              <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textDark }}>
                {result.display_name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <div
        style={{
          borderRadius: theme.borders.radius.sm,
          overflow: 'hidden',
          border: `${theme.borders.width} solid ${theme.colors.border}`,
          height: '300px',
        }}
      >
        <MapContainer
          center={[defaultLat, defaultLng]}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
              <Popup>{selectedLocation.name}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Selected Location Info */}
      {selectedLocation && !isCollapsed && (
        <div
          style={{
            background: '#f0f9ff',
            border: `${theme.borders.width} solid ${theme.colors.primaryLight}`,
            borderRadius: theme.borders.radius.sm,
            padding: theme.spacing.md,
          }}
        >
          <div style={{ fontSize: theme.typography.fontSize.sm, marginBottom: theme.spacing.xs }}>
            <strong>Selected Location:</strong>
          </div>
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.sm,
              wordBreak: 'break-word',
            }}
          >
            {selectedLocation.name}
          </div>
          <div
            style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.muted,
              marginBottom: theme.spacing.md,
            }}
          >
            Lat: {selectedLocation.lat.toFixed(6)}, Lon: {selectedLocation.lng.toFixed(6)}
          </div>
          <button
            type="button"
            onClick={handleConfirmLocation}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              background: theme.colors.success,
              color: 'white',
              border: 'none',
              borderRadius: theme.borders.radius.sm,
              fontSize: theme.typography.fontSize.sm,
              cursor: 'pointer',
              fontWeight: theme.typography.fontWeight.medium,
              transition: theme.transitions.fast,
            }}
          >
            Confirm Location
          </button>
        </div>
      )}
    </div>
  )
}
