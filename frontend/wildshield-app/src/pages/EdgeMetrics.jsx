import React, { useState, useEffect } from 'react';
import { 
    MdSettingsInputAntenna, MdMemory, MdSpeed, MdTimer, 
    MdMonitor, MdSlowMotionVideo, MdStorage
} from 'react-icons/md';
import { 
    RadialBarChart, RadialBar, ResponsiveContainer, 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const EdgeMetrics = () => {
    const [metrics, setMetrics] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                // Fetch from the top-level endpoint as requested
                const response = await fetch('http://localhost:8000/edge-metrics');
                const data = await response.json();
                setMetrics(data);
                
                setHistory(prev => {
                    const newHistory = [...prev, { 
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
                        cpu: data.cpu_usage, 
                        fps: data.fps 
                    }];
                    return newHistory.slice(-15);
                });
            } catch (err) {
                console.error("Failed to fetch edge metrics:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 2000);
        return () => clearInterval(interval);
    }, []);

    const radialData = metrics ? [
        { name: 'CPU Usage', value: metrics.cpu_usage, fill: '#3b82f6' },
        { name: 'Inference', value: metrics.inference_time_ms, fill: '#8b5cf6' }
    ] : [];

    if (loading && !metrics) return <div className="loading-container">Connecting to Edge Gateway...</div>;
    if (!metrics) return <div className="loading-container">Waiting for device data...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1><MdSettingsInputAntenna style={{ marginRight: '10px' }} /> Edge Intelligence Metrics</h1>
                    <p>Live performance tracking of YOLOv8 inference on remote IoT monitoring hardware.</p>
                </div>
                <div className="device-status">
                    <span className="status-indicator online"></span>
                    Node: UGANDA-FIELD-CAM-01
                </div>
            </div>

            <div className="edge-grid">
                <div className="edge-main">
                    <div className="dashboard-grid">
                        <div className="dashboard-card edge-stat-card">
                            <MdMemory size={32} color="#3b82f6" />
                            <div className="stat-content">
                                <span className="label">CPU Usage</span>
                                <span className="value">{metrics.cpu_usage}%</span>
                            </div>
                        </div>
                        <div className="dashboard-card edge-stat-card">
                            <MdTimer size={32} color="#8b5cf6" />
                            <div className="stat-content">
                                <span className="label">Inference Latency</span>
                                <span className="value">{metrics.inference_time_ms} ms</span>
                            </div>
                        </div>
                        <div className="dashboard-card edge-stat-card">
                            <MdSlowMotionVideo size={32} color="#f43f5e" />
                            <div className="stat-content">
                                <span className="label">Processing FPS</span>
                                <span className="value">{metrics.fps}</span>
                            </div>
                        </div>
                        <div className="dashboard-card edge-stat-card">
                            <MdStorage size={32} color="#10b981" />
                            <div className="stat-content">
                                <span className="label">Model Weight Size</span>
                                <span className="value">{metrics.model_size_mb} MB</span>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card chart-card" style={{ marginTop: '20px' }}>
                        <div className="card-header">
                            <h3>Performance Trending</h3>
                            <p>Real-time processing stability (CPU & FPS)</p>
                        </div>
                        <div className="chart-container" style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="time" hide />
                                    <YAxis stroke="#666" />
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: '#fff' }} />
                                    <Line type="monotone" dataKey="cpu" name="CPU %" stroke="#3b82f6" strokeWidth={3} dot={false} isAnimationActive={false} />
                                    <Line type="monotone" dataKey="fps" name="Frames Per Sec" stroke="#f43f5e" strokeWidth={3} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="edge-sidebar">
                    <div className="dashboard-card">
                        <h3>Resource Utilization</h3>
                        <div className="health-visual" style={{ height: '250px' }}>
                           <ResponsiveContainer width="100%" height="100%">
                               <RadialBarChart 
                                    innerRadius="20%" 
                                    outerRadius="90%" 
                                    data={radialData} 
                                    barSize={20}
                                >
                                    <RadialBar minAngle={15} label={{ fill: '#fff', position: 'insideStart' }} background dataKey='value' />
                                    <Legend iconSize={10} width={100} height={140} layout='vertical' verticalAlign='middle' align="right" />
                                    <Tooltip />
                                </RadialBarChart>
                           </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="dashboard-card" style={{ marginTop: '20px' }}>
                        <h3>Optimization Specs</h3>
                        <div className="info-list">
                            <div className="info-item">
                                <span>Optimization</span>
                                <span>INT8 Quantized</span>
                            </div>
                            <div className="info-item">
                                <span>Library</span>
                                <span>NCNN / Vulkan</span>
                            </div>
                            <div className="info-item">
                                <span>Thread Count</span>
                                <span>4 (Affinity Active)</span>
                            </div>
                            <div className="info-item">
                                <span>Status</span>
                                <span style={{ color: 'var(--accent-emerald)' }}>OPTIMAL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EdgeMetrics;
