"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Dynamic latitude/longitude lookup mapping for our 10 seed locations
const COORDINATES_MAP: Record<string, [number, number]> = {
  IN: [19.0760, 72.8777],    // Mumbai (Scan Center)
  US: [40.7128, -74.0060],   // New York
  GB: [51.5074, -0.1278],    // London
  JP: [35.6762, 139.6503],   // Tokyo
  DE: [52.5200, 13.4050],    // Berlin
  AU: [-33.8688, 151.2093],  // Sydney
  NG: [6.5244, 3.3792],      // Lagos
  AR: [-34.6037, -58.3816],  // Buenos Aires
  AE: [25.2048, 55.2708],    // Dubai
  SG: [1.3521, 103.8198]     // Singapore
};

export interface MapPin {
  country_code: string;
  name: string;
  flag_emoji?: string;
  price_usd: number;
  currency: string;
  price_local: number;
  device_profile: string;
}

interface MapComponentProps {
  results: MapPin[];
  scanCenterCode?: string;
}

export default function MapComponent({ results, scanCenterCode = "IN" }: MapComponentProps) {
  // Fix Leaflet container size bugs on dynamically rendered containers
  useEffect(() => {
    // Force Map resize invalidation
    window.dispatchEvent(new Event("resize"));
  }, [results]);

  const centerCoords = COORDINATES_MAP[scanCenterCode] || [19.0760, 72.8777];

  // Helper to construct custom SVG icons preventing Webpack Leaflet asset bugs
  const createCustomIcon = (isInflated: boolean) => {
    const color = isInflated ? "#FF3333" : "#00FFFF";
    const size = isInflated ? 14 : 10;
    
    return L.divIcon({
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <span style="
            background-color: ${color};
            width: ${size}px;
            height: ${size}px;
            display: block;
            border-radius: 50%;
            border: 2px solid #F3F3F0;
            box-shadow: 0 0 12px ${color};
            transition: all 0.3s ease;
          "></span>
          ${isInflated ? `
            <span style="
              position: absolute;
              width: 26px;
              height: 26px;
              border: 1px solid #FF3333;
              border-radius: 50%;
              animation: pulse-ring 1.8s infinite cubic-bezier(0.215, 0.610, 0.355, 1);
            "></span>
          ` : ""}
        </div>
      `,
      className: "custom-forensic-icon",
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  // Find min price to flag inflated nodes
  const prices = results.map(r => r.price_usd).filter(p => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

  return (
    <div className="w-full h-full relative border-editorial bg-[#050506]">
      {/* Dynamic Keyframes for Pulsing Ring */}
      <style jsx global>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.3); opacity: 1; }
          80%, 100% { transform: scale(1.3); opacity: 0; }
        }
        .leaflet-container {
          background: #050506 !important;
          width: 100%;
          height: 100%;
        }
        .leaflet-bar {
          border: 1px solid rgba(243, 243, 240, 0.08) !important;
          border-radius: 0px !important;
        }
        .leaflet-bar a {
          background-color: #111113 !important;
          color: #F3F3F0 !important;
          border-bottom: 1px solid rgba(243, 243, 240, 0.08) !important;
          border-radius: 0px !important;
        }
        .leaflet-bar a:hover {
          background-color: #F3F3F0 !important;
          color: #050506 !important;
        }
      `}</style>

      <MapContainer
        center={centerCoords}
        zoom={2}
        minZoom={1.5}
        maxZoom={8}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Center marker representing scanning source coordinate */}
        <Marker position={centerCoords} icon={createCustomIcon(false)}>
          <Popup>
            <div className="text-[#050506] font-sans p-1">
              <strong className="block border-b pb-1 font-semibold uppercase tracking-wider text-xs">Forensic Scan Center</strong>
              <span className="text-xs">Location: Mumbai, India (Scan Origin Point)</span>
            </div>
          </Popup>
        </Marker>

        {results.map((result, idx) => {
          const coords = COORDINATES_MAP[result.country_code];
          if (!coords) return null;

          const isCenter = result.country_code === scanCenterCode;
          if (isCenter) return null; // Already rendered center marker

          const isInflated = result.price_usd > minPrice * 1.15; // Flag > 15% markup

          return (
            <div key={`${result.country_code}-${idx}`}>
              {/* Connection Polyline path linking origin with proxies */}
              <Polyline
                positions={[centerCoords, coords]}
                pathOptions={{
                  color: isInflated ? "#FF3333" : "#00FFFF",
                  weight: 1,
                  dashArray: "3, 6",
                  opacity: isInflated ? 0.6 : 0.4
                }}
              />

              {/* Pulsing warning aura for dynamic markup locations */}
              {isInflated && (
                <Circle
                  center={coords}
                  radius={400000}
                  pathOptions={{
                    fillColor: "#FF3333",
                    fillOpacity: 0.1,
                    color: "#FF3333",
                    weight: 1,
                    opacity: 0.3
                  }}
                />
              )}

              {/* Geographic search proxy marker */}
              <Marker position={coords} icon={createCustomIcon(isInflated)}>
                <Popup>
                  <div className="text-[#050506] font-sans p-2 w-52">
                    <strong className="block border-b pb-1 uppercase tracking-wider text-xs font-semibold mb-1 text-slate-800">
                      {result.flag_emoji} {result.name}
                    </strong>
                    <div className="flex flex-col gap-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Price Local:</span>
                        <span className="font-mono font-bold text-slate-900">{result.currency} {result.price_local}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1 mb-1">
                        <span>Price USD:</span>
                        <span className="font-mono font-bold text-slate-900">${result.price_usd} USD</span>
                      </div>
                      {isInflated ? (
                        <div className="text-red-600 font-bold tracking-tight text-[10px] uppercase border border-red-200 bg-red-50 p-1 text-center">
                          ⚠️ Exploitative Markup Detected
                        </div>
                      ) : (
                        <div className="text-emerald-700 font-bold tracking-tight text-[10px] uppercase border border-emerald-100 bg-emerald-50 p-1 text-center">
                          ✅ Base Fair Market Price
                        </div>
                      )}
                      <div className="mt-1 text-[9px] text-slate-400 font-mono leading-tight">
                        {result.device_profile}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
