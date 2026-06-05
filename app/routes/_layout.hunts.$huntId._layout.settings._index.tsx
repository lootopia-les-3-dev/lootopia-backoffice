import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { FileImage, X } from "lucide-react"
import { MediaPreview } from "~/components/ui/MediaPreview"
import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useRevalidator, useRouteLoaderData } from "react-router"
import { useUserLocation } from "~/hooks/useUserLocation"
import { MediaPicker } from "~/components/media/MediaPicker"
import Switch from "~/components/utils/Switch"
import { Field } from "~/components/ui/Field"
import { Label } from "~/components/ui/Label"
import { TextInput } from "~/components/ui/TextInput"
import { Textarea } from "~/components/ui/Textarea"
import type { rootLoader } from "~/loaders/rootloader"
import type { HuntLight } from "~/types/Hunt"

type LoaderData = { hunt: HuntLight | null; slug: string }

const statusOptions = [
  { value: "draft", label: "Brouillon" },
  { value: "published", label: "Publié" },
  { value: "archived", label: "Archivé" },
] as const

// ─── Types ────────────────────────────────────────────────────────────────────

type LatLng = { lat: number; lng: number }
type CircleGeo = { type: "circle"; center: LatLng; radius: number }
type BoundaryGeo = { type: "boundary"; boundary: LatLng[] }
type GeoValue = CircleGeo | BoundaryGeo | null

// ─── Helpers ──────────────────────────────────────────────────────────────────

const metersToLngDelta = (m: number, lat: number) => m / (111320 * Math.cos((lat * Math.PI) / 180))
const metersToLatDelta = (m: number) => m / 110540

const circleCoords = (center: LatLng, radius: number, steps = 64): [number, number][] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * 2 * Math.PI
    return [center.lng + metersToLngDelta(radius, center.lat) * Math.cos(a), center.lat + metersToLatDelta(radius) * Math.sin(a)]
  })

const boundaryCoords = (pts: LatLng[]): [number, number][] =>
  pts.length > 0 ? [...pts.map((p): [number, number] => [p.lng, p.lat]), [pts[0].lng, pts[0].lat]] : []

const FILL = "#a855f7"
const STROKE = "#7c3aed"

const drawZone = (map: mapboxgl.Map, v: GeoValue) => {
  const coords: [number, number][] =
    v?.type === "circle" ? circleCoords(v.center, v.radius)
    : v?.type === "boundary" ? boundaryCoords(v.boundary)
    : []

  const geojson: GeoJSON.Feature = { type: "Feature", geometry: { type: "Polygon", coordinates: [coords] }, properties: {} }
  const src = map.getSource("zone") as mapboxgl.GeoJSONSource | undefined
  if (src) {
    src.setData(geojson)
  } else {
    map.addSource("zone", { type: "geojson", data: geojson })
    map.addLayer({ id: "zone-fill", type: "fill", source: "zone", paint: { "fill-color": FILL, "fill-opacity": 0.2 } })
    map.addLayer({ id: "zone-stroke", type: "line", source: "zone", paint: { "line-color": STROKE, "line-width": 2 } })
  }
}

// ─── MapPicker ────────────────────────────────────────────────────────────────

const MapPicker = ({ geoType, value, onChange, mapboxToken }: {
  geoType: "circle" | "boundary"
  value: GeoValue
  onChange: (v: GeoValue) => void
  mapboxToken: string
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const boundaryMarkersRef = useRef<mapboxgl.Marker[]>([])
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)
  // Always-fresh refs — no stale closure issues
  const valueRef = useRef<GeoValue>(value)
  const onChangeRef = useRef(onChange)
  useEffect(() => { valueRef.current = value }, [value])
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  const userLocation = useUserLocation()
  const userLocationRef = useRef(userLocation)
  useEffect(() => { userLocationRef.current = userLocation }, [userLocation])

  useEffect(() => {
    if (!containerRef.current) return
    mapboxgl.accessToken = mapboxToken

    // Priority: existing zone → user location → Paris
    const userLoc = userLocationRef.current.status === "granted"
      ? [userLocationRef.current.lng, userLocationRef.current.lat] as [number, number]
      : null

    const initialCenter: [number, number] =
      value?.type === "circle" ? [value.center.lng, value.center.lat]
      : value?.type === "boundary" && value.boundary.length > 0
        ? [
            value.boundary.reduce((s, p) => s + p.lng, 0) / value.boundary.length,
            value.boundary.reduce((s, p) => s + p.lat, 0) / value.boundary.length,
          ]
        : userLoc ?? [2.3488, 48.8534]

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: initialCenter,
      zoom: value ? 11 : userLoc ? 13 : 10,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), "top-right")

    map.on("load", () => {
      if (valueRef.current) drawZone(map, valueRef.current)

      if (geoType === "circle") {
        const placeMarker = (lngLat: [number, number]) => {
          markerRef.current?.remove()
          const m = new mapboxgl.Marker({ draggable: true, color: FILL }).setLngLat(lngLat).addTo(map)
          markerRef.current = m

          m.on("drag", () => {
            const ll = m.getLngLat()
            const r = (valueRef.current as CircleGeo)?.radius ?? 500
            drawZone(map, { type: "circle", center: { lat: ll.lat, lng: ll.lng }, radius: r })
          })
          m.on("dragend", () => {
            const ll = m.getLngLat()
            const r = (valueRef.current as CircleGeo)?.radius ?? 500
            onChangeRef.current({ type: "circle", center: { lat: ll.lat, lng: ll.lng }, radius: r })
          })
        }

        if (valueRef.current?.type === "circle") {
          placeMarker([valueRef.current.center.lng, valueRef.current.center.lat])
        }

        map.on("click", (e) => {
          const r = (valueRef.current as CircleGeo)?.radius ?? 500
          placeMarker([e.lngLat.lng, e.lngLat.lat])
          onChangeRef.current({ type: "circle", center: { lat: e.lngLat.lat, lng: e.lngLat.lng }, radius: r })
        })
      }

      if (geoType === "boundary") {
        const syncMarkers = (pts: LatLng[]) => {
          boundaryMarkersRef.current.forEach((m) => m.remove())
          boundaryMarkersRef.current = []

          pts.forEach((pt, i) => {
            const m = new mapboxgl.Marker({ draggable: true, color: FILL })
              .setLngLat([pt.lng, pt.lat])
              .addTo(map)

            m.on("drag", () => {
              const current = (valueRef.current as BoundaryGeo)?.boundary ?? []
              const ll = m.getLngLat()
              const updated = current.map((p, j) => j === i ? { lat: ll.lat, lng: ll.lng } : p)
              drawZone(map, { type: "boundary", boundary: updated })
            })
            m.on("dragend", () => {
              const current = (valueRef.current as BoundaryGeo)?.boundary ?? []
              const ll = m.getLngLat()
              const updated = current.map((p, j) => j === i ? { lat: ll.lat, lng: ll.lng } : p)
              onChangeRef.current({ type: "boundary", boundary: updated })
            })

            boundaryMarkersRef.current.push(m)
          })
        }

        if (valueRef.current?.type === "boundary") {
          syncMarkers(valueRef.current.boundary)
          if (valueRef.current.boundary.length > 1) {
            const lngs = valueRef.current.boundary.map((p) => p.lng)
            const lats = valueRef.current.boundary.map((p) => p.lat)
            map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60 })
          }
        }

        map.on("click", (e) => {
          const current = (valueRef.current as BoundaryGeo)?.boundary ?? []
          const updated = [...current, { lat: e.lngLat.lat, lng: e.lngLat.lng }]
          syncMarkers(updated)
          const next: BoundaryGeo = { type: "boundary", boundary: updated }
          drawZone(map, next)
          onChangeRef.current(next)
        })
      }
    })

    return () => {
      markerRef.current?.remove()
      boundaryMarkersRef.current.forEach((m) => m.remove())
      userMarkerRef.current?.remove()
      map.remove()
      mapRef.current = null
    }
  }, [geoType, mapboxToken])

  // User location marker + initial fly-to if no zone
  useEffect(() => {
    const map = mapRef.current
    if (!map || userLocation.status !== "granted") return

    const { lat, lng } = userLocation

    const el = document.createElement("div")
    el.style.cssText = "width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 3px rgba(59,130,246,0.4)"

    userMarkerRef.current?.remove()
    userMarkerRef.current = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map)

    if (!valueRef.current) {
      map.flyTo({ center: [lng, lat], zoom: 13, duration: 800 })
    }
  }, [userLocation])

  // Redraw on radius change
  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    drawZone(map, value)
  }, [value])

  const canUndo = geoType === "boundary" && value?.type === "boundary" && value.boundary.length > 0

  return (
    <div className="flex flex-col gap-3">
      <div ref={containerRef} className="w-full h-72 rounded-xl overflow-hidden" />

      {geoType === "circle" && value?.type === "circle" && (
        <div className="flex items-center gap-3 flex-wrap">
          <Label>Rayon (m)</Label>
          <input
            type="number" min={50} max={100000} step={50}
            value={value.radius}
            onChange={(e) => onChange({ ...value, radius: Number(e.target.value) })}
            className="w-32 bg-mauve-100 dark:bg-mauve-700 border border-mauve-300 dark:border-mauve-500 rounded-lg px-3 py-1.5 text-sm text-mauve-900 dark:text-mauve-50 focus:outline-none"
          />
          <span className="text-xs text-mauve-400">
            Centre : {value.center.lat.toFixed(5)}, {value.center.lng.toFixed(5)}
          </span>
        </div>
      )}

      {geoType === "boundary" && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-mauve-400 italic">
            {!value || value.type !== "boundary" || value.boundary.length === 0
              ? "Clique sur la carte pour ajouter des points"
              : `${value.boundary.length} point${value.boundary.length > 1 ? "s" : ""} — clique pour en ajouter`}
          </p>
          {canUndo && (
            <button
              type="button"
              onClick={() => {
                const pts = (value as BoundaryGeo).boundary.slice(0, -1)
                const next: GeoValue = pts.length > 0 ? { type: "boundary", boundary: pts } : null
                onChange(next)
              }}
              className="text-xs text-mauve-400 hover:text-red-500 transition-colors"
            >
              Annuler dernier point
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const HuntSettings = () => {
  const { hunt, slug } = useRouteLoaderData<() => LoaderData>("routes/_layout.hunts.$huntId._layout")!
  const rootData = useRouteLoaderData<typeof rootLoader>("root")
  const { revalidate } = useRevalidator()
  const navigate = useNavigate()

  const userId = rootData?.user ? String(rootData.user.id) : undefined
  const mapboxToken = rootData?.mapboxToken ?? ""

  useEffect(() => { console.log("[hunt settings]", hunt) }, [])

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/hunts/${slug}`, { method: "DELETE" })
      if (res.ok) navigate("/hunts")
    } finally {
      setDeleting(false)
    }
  }

  const [name, setName] = useState(hunt?.name ?? "")
  const [description, setDescription] = useState((hunt as any)?.description ?? "")
  const [status, setStatus] = useState<"draft" | "published" | "archived">((hunt as any)?.status ?? "draft")
  const [passcode, setPasscode] = useState((hunt as any)?.passcode ?? "")
  const [coverKey, setCoverKey] = useState<string | null>(hunt?.coverKey ?? null)
  const [mediaPicker, setMediaPicker] = useState(false)

  const [geoEnabled, setGeoEnabled] = useState(!!(hunt as any)?.geoRestrictionType)
  const [geoType, setGeoType] = useState<"circle" | "boundary">(() => {
    const t = (hunt as any)?.geoRestrictionType
    return t === "circle" ? "circle" : "boundary"
  })
  const [geoValue, setGeoValue] = useState<GeoValue>(() => {
    const h = hunt as any
    if (!h?.geoRestrictionType) return null
    if (h.geoRestrictionType === "circle") return { type: "circle", center: { lat: h.center?.y ?? 0, lng: h.center?.x ?? 0 }, radius: h.radius ?? 500 }
    if (h.geoRestrictionType === "boundary") {
      try { return { type: "boundary", boundary: JSON.parse(h.boundary) } } catch { return null }
    }
    return null
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const body: Record<string, unknown> = {
      name: name.trim() || undefined,
      description: description || null,
      status,
      passcode: passcode || null,
      coverKey: coverKey || null,
      geoRestrictionType: geoEnabled ? geoType : null,
      center: null,
      radius: null,
      boundary: null,
    }

    if (geoEnabled && geoValue) {
      if (geoValue.type === "circle") {
        body.center = geoValue.center
        body.radius = geoValue.radius
      } else if (geoValue.type === "boundary") {
        body.boundary = geoValue.boundary
      }
    }

    try {
      const res = await fetch(`/api/hunts/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Erreur lors de la sauvegarde")
        return
      }
      setSaved(true)
      revalidate()
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("Erreur réseau")
    } finally {
      setSaving(false)
    }
  }

  const mediaScopes = {
    hunt: { huntSlug: slug },
    ...(hunt?.teamSlug ? { team: { teamSlug: hunt.teamSlug } } : {}),
    ...(userId ? { user: { userId } } : {}),
  }

  return (
    <>
      <div className="flex flex-col gap-6 h-full overflow-y-auto pr-1">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-2xl text-mauve-900 dark:text-mauve-50">Settings</h2>
          <Link to=".." className="p-1 hover:opacity-60 transition-opacity"><X className="h-5 w-5" /></Link>
        </div>

        {/* Cover */}
        <div className="flex flex-col gap-2">
          <Label>Cover</Label>
          <button
            type="button"
            onClick={() => setMediaPicker(true)}
            className="w-full h-36 rounded-xl border-2 border-dashed border-mauve-300 dark:border-mauve-600 flex flex-col items-center justify-center gap-2 hover:border-mauve-400 transition-colors overflow-hidden"
          >
            {coverKey ? (
              <MediaPreview src={`/api/files/hunt-${slug}/url?key=${encodeURIComponent(coverKey)}`} className="w-full h-full object-cover" />
            ) : (
              <>
                <FileImage size={24} className="text-mauve-400" />
                <span className="text-sm text-mauve-400">Choisir une image</span>
              </>
            )}
          </button>
          {coverKey && (
            <button type="button" onClick={() => setCoverKey(null)} className="text-xs text-mauve-400 hover:text-red-500 transition-colors text-left">
              Supprimer la cover
            </button>
          )}
        </div>

        {/* Name */}
        <Field label="Nom">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de la hunt"
            className="bg-mauve-100 dark:bg-mauve-700 border-mauve-300 dark:border-mauve-500 text-mauve-900 dark:text-mauve-50" />
        </Field>

        {/* Description */}
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description de la hunt..."
            className="min-h-20 bg-mauve-100 dark:bg-mauve-700 border-mauve-300 dark:border-mauve-500 text-mauve-900 dark:text-mauve-50" />
        </Field>

        {/* Status */}
        <div className="flex flex-col gap-2">
          <Label>Statut</Label>
          <div className="flex gap-2">
            {statusOptions.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${status === opt.value ? "bg-mauve-900 dark:bg-mauve-50 text-mauve-50 dark:text-mauve-900" : "bg-mauve-100 dark:bg-mauve-700 text-mauve-500 dark:text-mauve-400 hover:bg-mauve-200 dark:hover:bg-mauve-600"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Passcode */}
        <Field label="Code d'accès (optionnel)">
          <TextInput value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Laisser vide pour accès libre"
            className="bg-mauve-100 dark:bg-mauve-700 border-mauve-300 dark:border-mauve-500 text-mauve-900 dark:text-mauve-50" />
        </Field>

        {/* Geo restriction */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label>Restriction géographique</Label>
            <Switch enabled={geoEnabled} onChange={(v) => { setGeoEnabled(v); if (!v) setGeoValue(null) }} />
          </div>

          {geoEnabled && (
            <>
              <div className="flex gap-2">
                {(["circle", "boundary"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => { setGeoType(t); setGeoValue(null) }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${geoType === t ? "bg-purple-600 text-white" : "bg-mauve-100 dark:bg-mauve-700 text-mauve-500 dark:text-mauve-400 hover:bg-mauve-200 dark:hover:bg-mauve-600"}`}>
                    {t === "circle" ? "Cercle" : "Zone libre"}
                  </button>
                ))}
              </div>
              <MapPicker key={geoType} geoType={geoType} value={geoValue} onChange={setGeoValue} mapboxToken={mapboxToken} />
            </>
          )}
        </div>

        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

        <div className="flex items-center justify-between pt-2 pb-4">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Supprimer définitivement ?</span>
              <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs text-mauve-400 hover:opacity-60 px-2 py-1">
                Annuler
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="text-xs text-red-400 font-semibold hover:opacity-60 px-2 py-1 disabled:opacity-40">
                {deleting ? "Suppression..." : "Confirmer"}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="text-xs text-mauve-400 hover:text-red-500 transition-colors">
              Supprimer la hunt
            </button>
          )}

          <button type="button" onClick={handleSave} disabled={saving || !name.trim()}
            className="px-6 py-2 rounded-lg text-sm bg-mauve-900 dark:bg-mauve-50 text-mauve-50 dark:text-mauve-900 font-medium hover:opacity-80 disabled:opacity-40 transition-opacity">
            {saving ? "Sauvegarde..." : saved ? "Sauvegardé ✓" : "Sauvegarder"}
          </button>
        </div>
      </div>

      <MediaPicker open={mediaPicker} onClose={() => setMediaPicker(false)} onSelect={(key) => setCoverKey(key)} scopes={mediaScopes} defaultTab="hunt" />
    </>
  )
}

export default HuntSettings
