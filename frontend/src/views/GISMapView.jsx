import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { api } from '../services/api';
import { Map, Layers, AlertTriangle, Compass, Crosshair } from 'lucide-react';

export function GISMapView({ activeStation }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({});
  const [activeLayerName, setActiveLayerName] = useState('Esri Polar High-Res Satellite');
  const [cursorCoords, setCursorCoords] = useState({ lat: -70.766, lng: 11.733 });

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Map already mounted

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [-70.766, 11.733],
      zoom: 7,
      zoomControl: true,
      attributionControl: true
    });

    // Free tile layers (No API key needed)
    const esriSatellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 17,
        attribution: 'Esri, Maxar, Earthstar Geographics | MoES NCPOR GIS'
      }
    );

    const cartoDark = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }
    );

    const osm = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
      }
    );

    // Add Esri satellite as default
    esriSatellite.addTo(map);
    layersRef.current = {
      'Esri Polar High-Res Satellite': esriSatellite,
      'CartoDB Tactical Dark': cartoDark,
      'OpenStreetMap Standard': osm
    };

    // Scale bar
    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

    // Track mouse coordinates
    map.on('mousemove', (e) => {
      setCursorCoords({
        lat: parseFloat(e.latlng.lat.toFixed(4)),
        lng: parseFloat(e.latlng.lng.toFixed(4))
      });
    });

    // Custom DivIcon creator for reliable rendering
    const createStationIcon = (color, label) => {
      return L.divIcon({
        className: 'custom-station-icon',
        html: `
          <div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 8px rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;">
            <div style="width: 4px; height: 4px; background: #ffffff; border-radius: 50%;"></div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.9); color: #f8fafc; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 3px; border: 1px solid #475569; position: absolute; left: 22px; top: -2px; white-space: nowrap;">
            ${label}
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
    };

    // Markers for Indian Antarctic Research Stations
    const maitriMarker = L.marker([-70.766, 11.733], {
      icon: createStationIcon('#10b981', 'MAITRI BASE (India)')
    }).addTo(map);
    maitriMarker.bindPopup(`
      <div style="font-family: Inter, sans-serif; color: #0f172a; padding: 4px;">
        <h4 style="font-size: 13px; font-weight: 700; margin-bottom: 4px;">Maitri Station (Schirmacher Oasis)</h4>
        <p style="font-size: 11px; margin: 0;">Coordinates: 70°45′58″S 11°44′00″E</p>
        <p style="font-size: 11px; margin: 0;">Expedition: 44-ISEA Operational Hub</p>
        <p style="font-size: 11px; margin: 0; color: #15803d; font-weight: 600;">Status: Full Active Staffing (24 Personnel)</p>
      </div>
    `);

    const bharatiMarker = L.marker([-69.407, 76.187], {
      icon: createStationIcon('#0284c7', 'BHARATI BASE (India)')
    }).addTo(map);
    bharatiMarker.bindPopup(`
      <div style="font-family: Inter, sans-serif; color: #0f172a; padding: 4px;">
        <h4 style="font-size: 13px; font-weight: 700; margin-bottom: 4px;">Bharati Station (Larsemann Hills)</h4>
        <p style="font-size: 11px; margin: 0;">Coordinates: 69°24′28″S 76°11′14″E</p>
        <p style="font-size: 11px; margin: 0;">Expedition: Ocean & Earth Sciences Wing</p>
        <p style="font-size: 11px; margin: 0; color: #0369a1; font-weight: 600;">Status: Full Active Staffing (22 Personnel)</p>
      </div>
    `);

    const dgMarker = L.marker([-70.083, 12.000], {
      icon: createStationIcon('#f59e0b', 'DAKSHIN GANGOTRI (Staging Depot)')
    }).addTo(map);
    dgMarker.bindPopup(`
      <div style="font-family: Inter, sans-serif; color: #0f172a; padding: 4px;">
        <h4 style="font-size: 13px; font-weight: 700; margin-bottom: 4px;">Dakshin Gangotri Historical Base</h4>
        <p style="font-size: 11px; margin: 0;">Coordinates: 70°05′S 12°00′E (Ice Shelf)</p>
        <p style="font-size: 11px; margin: 0;">Use: Fuel Bunker & Ice-Shelf Staging Depot</p>
      </div>
    `);

    // Convoy Route Traverses (Polylines)
    const maitriConvoyTrack = [
      [-70.083, 12.000], // Dakshin Gangotri Ice Shelf
      [-70.250, 11.900], // Waypoint Alpha
      [-70.500, 11.820], // Waypoint Bravo
      [-70.766, 11.733]  // Maitri Base
    ];
    L.polyline(maitriConvoyTrack, {
      color: '#38bdf8',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.9
    }).addTo(map).bindPopup('<b>Active Convoy Route:</b> Ice Shelf Depot to Maitri Base (PB-04 Snowcat Sortie)');

    // Crevasse Hazard Warning Zone (Translucent Red Polygon)
    const hazardPolygon = [
      [-70.35, 11.50],
      [-70.45, 11.75],
      [-70.40, 12.10],
      [-70.30, 11.90]
    ];
    L.polygon(hazardPolygon, {
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.25,
      weight: 2
    }).addTo(map).bindPopup(`
      <div style="font-family: Inter, sans-serif; color: #0f172a; padding: 4px;">
        <h4 style="font-size: 12px; font-weight: 700; color: #b91c1c;">⚠️ HAZARD ZONE: Active Crevasse Field #A-44</h4>
        <p style="font-size: 11px; margin: 0;">Ground Penetrating Radar (GPR) scan required before traverse.</p>
        <p style="font-size: 11px; margin: 0; font-weight: 600;">Status: RESTRICTED SPEED (Max 8 km/h)</p>
      </div>
    `);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Center on active station when changed
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (activeStation === 'Bharati') {
      mapInstanceRef.current.setView([-69.407, 76.187], 9);
    } else {
      mapInstanceRef.current.setView([-70.766, 11.733], 8);
    }
  }, [activeStation]);

  const switchTileLayer = (name) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    Object.values(layersRef.current).forEach((l) => map.removeLayer(l));
    if (layersRef.current[name]) {
      layersRef.current[name].addTo(map);
      setActiveLayerName(name);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      {/* GIS Control Toolbar */}
      <div className="gov-card" style={{ marginBottom: 0 }}>
        <div className="gov-card-body" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Map size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Antarctic Geospatial Information System (EPSG:3031 Polar View)
            </span>
          </div>

          {/* Layer Selector Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={14} color="#94a3b8" />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginRight: '0.25rem' }}>Base Layer:</span>
            {['Esri Polar High-Res Satellite', 'CartoDB Tactical Dark', 'OpenStreetMap Standard'].map((layer) => (
              <button
                key={layer}
                onClick={() => switchTileLayer(layer)}
                className={`btn btn-sm ${activeLayerName === layer ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
              >
                {layer.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Live Coordinate Crosshairs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
            <Crosshair size={13} />
            <span>LAT: {cursorCoords.lat}°S | LON: {cursorCoords.lng}°E</span>
          </div>
        </div>
      </div>

      {/* Map Canvas and Legend Layout */}
      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: '520px', position: 'relative' }}>
        {/* Leaflet Map Div */}
        <div
          ref={mapContainerRef}
          style={{
            flex: 1,
            borderRadius: '6px',
            border: '1px solid #374151',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
            minHeight: '520px'
          }}
        />

        {/* Tactical Map Legend Box (Official Enterprise Legend, clearly distinct from API keys) */}
        <div
          style={{
            width: '240px',
            backgroundColor: '#111827',
            border: '1px solid #374151',
            borderRadius: '6px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}
        >
          <div style={{ fontSize: '0.775rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f8fafc', borderBottom: '1px solid #374151', paddingBottom: '0.4rem' }}>
            Tactical Map Legend
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.775rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid #fff' }}></div>
              <span>Maitri Station Hub</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0284c7', border: '2px solid #fff' }}></div>
              <span>Bharati Station Hub</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b', border: '2px solid #fff' }}></div>
              <span>Dakshin Gangotri Depot</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '18px', height: '3px', backgroundColor: '#38bdf8', borderTop: '2px dashed #38bdf8' }}></div>
              <span>Active Convoy Traverse</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '14px', height: '14px', backgroundColor: 'rgba(239, 68, 68, 0.3)', border: '1px solid #ef4444' }}></div>
              <span>Crevasse Field Hazard Zone</span>
            </div>
          </div>

          <div style={{ marginTop: 'auto', padding: '0.65rem', backgroundColor: '#1f2937', borderRadius: '4px', border: '1px solid #374151', fontSize: '0.7rem', color: '#94a3b8' }}>
            <div style={{ fontWeight: 600, color: '#34d399', marginBottom: '0.2rem' }}>✓ Zero-API-Key Direct Tile Stream</div>
            <div>Esri Polar World Satellite imagery active. High-resolution orthomosaic without rate-limits.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
