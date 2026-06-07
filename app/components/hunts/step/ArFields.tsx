import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useState } from "react"
import { Layer, Map, Marker, Source } from "react-map-gl/mapbox"
import { useRouteLoaderData } from "react-router"
import { Field } from "~/components/ui/Field"
import { Label } from "~/components/ui/Label"
import { Select } from "~/components/ui/Select"
import { Stepper } from "~/components/ui/Stepper"
import Switch from "~/components/utils/Switch"
import type { useHuntManager } from "~/hooks/huntManagerHook"
import { useUserLocation } from "~/hooks/useUserLocation"
import { type rootLoader } from "~/loaders/rootloader"
import type { GeoCoordinate, GeoType, HuntStep, StepGame } from "~/types/Hunt"

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

export const ArFields = ({ step, stepId, updateStep }: Props) => {
  const { mapboxToken } = useRouteLoaderData<typeof rootLoader>("root")!

  const arGeoType = (step.step.arGeoType as GeoType | undefined) ?? "point"
  const [geoEnabled, setGeoEnabled] = useState(!!(step.step.arGeoType))
  const [pointCoords, setPointCoords] = useState<GeoCoordinate | null>(step.step.arPointCoordinates as GeoCoordinate ?? null)
  const [boundary, setBoundary] = useState<GeoCoordinate[]>(step.step.arBoundaryCoordinates as GeoCoordinate[] ?? [])
  const [radius, setRadius] = useState((step.step.arRadius as number | undefined) ?? 100)

  useEffect(() => { setGeoEnabled(!!(step.step.arGeoType)) }, [step.step.arGeoType])
  useEffect(() => { setPointCoords(step.step.arPointCoordinates as GeoCoordinate ?? null) }, [step.step.arPointCoordinates])
  useEffect(() => { setBoundary(step.step.arBoundaryCoordinates as GeoCoordinate[] ?? []) }, [step.step.arBoundaryCoordinates])
  useEffect(() => { setRadius((step.step.arRadius as number | undefined) ?? 100) }, [step.step.arRadius])

  const handleToggleGeo = (enabled: boolean) => {
    setGeoEnabled(enabled)
    if (!enabled) {
      updateStep({ stepId, arGeoType: null, arPointCoordinates: null, arBoundaryCoordinates: null, arRadius: null })
    } else {
      updateStep({ stepId, arGeoType: "point" })
    }
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

  const handleMapClick = (e: { lngLat: { lat: number; lng: number } }) => {
    const coord = { lat: e.lngLat.lat, lng: e.lngLat.lng }
    if (arGeoType === "point") {
      setPointCoords(coord)
      updateStep({ stepId, arPointCoordinates: coord })
    } else {
      const next = [...boundary, coord]
      setBoundary(next)
      updateStep({ stepId, arBoundaryCoordinates: next })
    }
  }

  const removePoint = (index: number) => {
    const next = boundary.filter((_, i) => i !== index)
    setBoundary(next)
    updateStep({ stepId, arBoundaryCoordinates: next })
  }

  const clearBoundary = () => {
    setBoundary([])
    updateStep({ stepId, arBoundaryCoordinates: [] })
  }

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
      <Field label="Mini-jeu AR" stepId={stepId} field="stepGame">
        <Select
          value={step.step.stepGame ?? "collect"}
          onChange={(e) => updateStep({ stepId, stepGame: e.target.value as StepGame })}
        >
          <option value="collect">collect</option>
          <option value="dig">dig</option>
        </Select>
      </Field>

      <div className="flex items-center justify-between">
        <Label>Zone géographique AR</Label>
        <Switch enabled={geoEnabled} onChange={handleToggleGeo} />
      </div>

      {geoEnabled && (
      <>
      <Field label="Type de zone AR">
        <Select
          value={arGeoType}
          onChange={(e) => updateStep({ stepId, arGeoType: e.target.value as GeoType })}
        >
          <option value="point">point (coordonnée + rayon)</option>
          <option value="boundary">boundary (polygone)</option>
        </Select>
      </Field>

      <div className="flex flex-col gap-1">
        <Label>
          Carte — {arGeoType === "point" ? "clic pour placer le point" : "clics pour tracer le polygone"}
        </Label>
        <div className="rounded-lg overflow-hidden" style={{ height: 300 }}>
          <Map
            mapboxAccessToken={mapboxToken}
            initialViewState={{ longitude: center.lng, latitude: center.lat, zoom: 12 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            onClick={handleMapClick}
          >
            {arGeoType === "point" && validPoint && (
              <>
                <Marker longitude={validPoint.lng} latitude={validPoint.lat} />
                <Source id="ar-radius" type="geojson" data={makeCircleGeoJson(validPoint, radius)}>
                  <Layer id="ar-radius-fill" type="fill" paint={{ "fill-color": "#f59e0b", "fill-opacity": 0.15 }} />
                  <Layer id="ar-radius-outline" type="line" paint={{ "line-color": "#f59e0b", "line-width": 1.5 }} />
                </Source>
              </>
            )}

            {userLocation.status === "granted" && (
              <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
              </Marker>
            )}

            {arGeoType === "boundary" && (
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
                  <Source id="ar-boundary" type="geojson" data={boundaryGeoJson}>
                    <Layer id="ar-boundary-fill" type="fill" paint={{ "fill-color": "#f59e0b", "fill-opacity": 0.15 }} />
                    <Layer id="ar-boundary-outline" type="line" paint={{ "line-color": "#f59e0b", "line-width": 1.5, "line-dasharray": [2, 1] }} />
                  </Source>
                )}
              </>
            )}
          </Map>
        </div>
        {arGeoType === "boundary" && boundary.length > 0 && (
          <button className="text-xs text-red-400 hover:opacity-60 self-end" onClick={clearBoundary}>
            Effacer le polygone
          </button>
        )}
      </div>

      {arGeoType === "point" && (
        <Field label="Rayon (mètres)">
          <Stepper
            value={radius}
            min={5}
            step={10}
            onChange={(next) => { setRadius(next); updateStep({ stepId, arRadius: next }) }}
          />
        </Field>
      )}
      </>
      )}
    </>
  )
}
