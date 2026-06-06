import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useState } from "react"
import { Layer, Map, Marker, Source } from "react-map-gl/mapbox"
import { useRouteLoaderData } from "react-router"
import { Field } from "~/components/ui/Field"
import { Label } from "~/components/ui/Label"
import { Select } from "~/components/ui/Select"
import { Stepper } from "~/components/ui/Stepper"
import type { useHuntManager } from "~/hooks/huntManagerHook"
import { useUserLocation } from "~/hooks/useUserLocation"
import { type rootLoader } from "~/loaders/rootloader"
import type { GeoCoordinate, GeoType, HuntStep } from "~/types/Hunt"

type Props = {
  step: HuntStep
  stepId: string
  updateStep: ReturnType<typeof useHuntManager>["updateStep"]
}

const DEFAULT_CENTER: GeoCoordinate = { lat: 48.8566, lng: 2.3522 }

const makeCircleGeoJson = (center: GeoCoordinate, radiusMeters: number, points = 64): GeoJSON.Feature => {
  const coords: [number, number][] = []
  const R = 6371000
  const lat = (center.lat * Math.PI) / 180
  const lng = (center.lng * Math.PI) / 180
  const d = radiusMeters / R
  for (let i = 0; i <= points; i++) {
    const bearing = (2 * Math.PI * i) / points
    const pLat = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(bearing))
    const pLng = lng + Math.atan2(Math.sin(bearing) * Math.sin(d) * Math.cos(lat), Math.cos(d) - Math.sin(lat) * Math.sin(pLat))
    coords.push([(pLng * 180) / Math.PI, (pLat * 180) / Math.PI])
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coords] } }
}

export const GeoFields = ({ step, stepId, updateStep }: Props) => {
  const { mapboxToken } = useRouteLoaderData<typeof rootLoader>("root")!
  const geoType = step.step.geoType ?? "point"

  const [pointCoords, setPointCoords] = useState<GeoCoordinate | null>(step.step.pointCoordinates ?? null)
  const [boundary, setBoundary] = useState<GeoCoordinate[]>(step.step.boundaryCoordinates ?? [])
  const [radius, setRadius] = useState(step.step.radius ?? 100)

  useEffect(() => { setPointCoords(step.step.pointCoordinates ?? null) }, [step.step.pointCoordinates])
  useEffect(() => { setBoundary(step.step.boundaryCoordinates ?? []) }, [step.step.boundaryCoordinates])
  useEffect(() => { setRadius(step.step.radius ?? 100) }, [step.step.radius])

  const handleMapClick = (e: { lngLat: { lat: number; lng: number } }) => {
    const coord = { lat: e.lngLat.lat, lng: e.lngLat.lng }
    if (geoType === "point") {
      setPointCoords(coord)
      updateStep({ stepId, pointCoordinates: coord })
    } else {
      const next = [...boundary, coord]
      setBoundary(next)
      updateStep({ stepId, boundaryCoordinates: next })
    }
  }

  const removePoint = (index: number) => {
    const next = boundary.filter((_, i) => i !== index)
    setBoundary(next)
    updateStep({ stepId, boundaryCoordinates: next })
  }

  const clearBoundary = () => {
    setBoundary([])
    updateStep({ stepId, boundaryCoordinates: [] })
  }

  const userLocation = useUserLocation()

  const validBoundary = boundary.filter((p) => typeof p?.lat === "number" && typeof p?.lng === "number" && isFinite(p.lat) && isFinite(p.lng))
  const boundaryCenter: GeoCoordinate | null = validBoundary.length > 0
    ? { lat: validBoundary.reduce((s, p) => s + p.lat, 0) / validBoundary.length, lng: validBoundary.reduce((s, p) => s + p.lng, 0) / validBoundary.length }
    : null

  const validPoint = pointCoords && isFinite(pointCoords.lat) && isFinite(pointCoords.lng) ? pointCoords : null

  const center = validPoint
    ?? boundaryCenter
    ?? (userLocation.status === "granted" ? { lat: userLocation.lat, lng: userLocation.lng } : null)
    ?? DEFAULT_CENTER

  const boundaryGeoJson: GeoJSON.Feature | null = boundary.length >= 3
    ? {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[...boundary, boundary[0]].map((c) => [c.lng, c.lat])],
      },
    }
    : null

  return (
    <>
      <Field label="Type géo">
        <Select
          value={geoType}
          onChange={(e) => updateStep({ stepId, geoType: e.target.value as GeoType })}
        >
          <option value="point">point (coordonnée + rayon)</option>
          <option value="boundary">boundary (polygone)</option>
        </Select>
      </Field>

      <div className="flex flex-col gap-1">
        <Label>
          Carte — {geoType === "point" ? "clic pour placer le point" : "clics pour tracer le polygone"}
        </Label>
        <div className="rounded-lg overflow-hidden" style={{ height: 300 }}>
          <Map
            mapboxAccessToken={mapboxToken}
            initialViewState={{ longitude: center.lng, latitude: center.lat, zoom: 12 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            onClick={handleMapClick}
          >
            {geoType === "point" && validPoint && (
              <>
                <Marker longitude={validPoint.lng} latitude={validPoint.lat} />
                <Source id="radius" type="geojson" data={makeCircleGeoJson(validPoint, radius)}>
                  <Layer id="radius-fill" type="fill" paint={{ "fill-color": "#7c3aed", "fill-opacity": 0.15 }} />
                  <Layer id="radius-outline" type="line" paint={{ "line-color": "#7c3aed", "line-width": 1.5 }} />
                </Source>
              </>
            )}

            {userLocation.status === "granted" && (
              <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
              </Marker>
            )}

            {geoType === "boundary" && (
              <>
                {validBoundary.map((c, i) => (
                  <Marker
                    key={i}
                    longitude={c.lng}
                    latitude={c.lat}
                    onClick={(e) => { e.originalEvent.stopPropagation(); removePoint(i) }}
                    style={{ cursor: "pointer" }}
                  />
                ))}
                {boundaryGeoJson && (
                  <Source id="boundary" type="geojson" data={boundaryGeoJson}>
                    <Layer id="boundary-fill" type="fill" paint={{ "fill-color": "#7c3aed", "fill-opacity": 0.15 }} />
                    <Layer id="boundary-outline" type="line" paint={{ "line-color": "#7c3aed", "line-width": 1.5, "line-dasharray": [2, 1] }} />
                  </Source>
                )}
              </>
            )}
          </Map>
        </div>
        {geoType === "boundary" && boundary.length > 0 && (
          <button className="text-xs text-red-400 hover:opacity-60 self-end" onClick={clearBoundary}>
            Effacer le polygone
          </button>
        )}
        <p className="text-xs text-mauve-400">
          {userLocation.status === "granted" && `Position : ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`}
          {userLocation.status === "requesting" && "Récupération de la position…"}
          {userLocation.status === "denied" && `Localisation refusée : ${userLocation.error}`}
          {userLocation.status === "idle" && "Localisation en attente…"}
        </p>
      </div>

      {geoType === "point" && (
        <Field label="Rayon (mètres)">
          <Stepper
            value={radius}
            min={5}
            step={10}
            onChange={(next) => { setRadius(next); updateStep({ stepId, radius: next }) }}
          />
        </Field>
      )}
    </>
  )
}
