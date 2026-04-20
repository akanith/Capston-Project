import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, LayerGroup } from "react-leaflet";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = () => {
      fetch("http://localhost:8000/locations")
        .then(res => res.json())
        .then(json => {
            setData(Array.isArray(json) ? json : []);
            setLoading(false);
        })
        .catch(err => {
            console.error("Failed to fetch locations:", err);
            setLoading(false);
        });
    };

    fetchLocations();
    const interval = setInterval(fetchLocations, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  if (loading && data.length === 0) {
      return (
        <div className="loading-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#fff' }}>
            <div className="spinner" style={{ marginRight: '12px' }}></div>
            Scanning tracking nodes...
        </div>
      );
  }

  return (
    <div className="page-container" style={{ height: "calc(100vh - 100px)", width: "100%", padding: '20px' }}>
      <div className="page-header" style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#fff' }}>Wildlife Tracking Map</h2>
          <p style={{ color: 'var(--text-muted)' }}>Real-time spatial visualization of AI detections across monitoring sectors.</p>
      </div>
      <div className="dashboard-card" style={{ height: 'calc(100% - 60px)', width: '100%', padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <MapContainer
            center={[1.97, 31.59]}
            zoom={8}
            style={{ height: "100%", width: "100%", background: '#0e0b14' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <LayerGroup>
                {data.map((item, index) => (
                    <Marker 
                        key={`${index}-${item.id || item.species}`} 
                        position={[item.lat, item.lng]}
                    >
                        <Popup>
                            <div style={{ color: '#000', padding: '5px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{item.species}</div>
                                <div style={{ fontSize: '11px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Detected at: {item.time || 'N/A'}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </LayerGroup>
          </MapContainer>
      </div>
    </div>
  );
}
