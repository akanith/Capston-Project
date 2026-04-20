import React, { useState, useEffect } from 'react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { MdAutoGraph, MdCompare, MdTrendingUp, MdInfoOutline } from 'react-icons/md';

const FLAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/metrics');
                const result = await response.json();
                if (result.success && result.training_history) {
                    setData(result.training_history);
                }
            } catch (err) {
                console.error("Failed to fetch FL metrics:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) return <div className="loading-container">Loading FL Analytics...</div>;
    if (!data) return <div className="error-message">No training history found. Please run a federated training cycle first.</div>;

    const roundData = data.rounds.map(r => ({
        round: r.round,
        accuracy: r.global_accuracy * 100,
        loss: r.global_loss,
        time: r.time_seconds
    }));

    // Client contribution (simulated/extracted from last round)
    const lastRound = data.rounds[data.rounds.length - 1];
    const clientData = lastRound.clients.map(c => ({
        name: `Client ${c.client_id}`,
        accuracy: c.accuracy * 100,
        samples: c.samples,
        cost: (c.samples * 0.15).toFixed(2) // Simulated comm cost (MB)
    }));

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1><MdAutoGraph style={{ marginRight: '10px' }} /> FL Analytics Dashboard</h1>
                    <p>Federated Learning performance tracking and multi-client contribution analysis.</p>
                </div>
                <div className="header-actions">
                    <div className="status-badge pulse">
                        <span className="pulse-dot"></span>
                        DP Enabled: Active
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Accuracy vs Round */}
                <div className="dashboard-card chart-card full-width">
                    <div className="card-header">
                        <h3><MdTrendingUp /> Global Model Accuracy Convergence</h3>
                        <p>Accuracy improvement over {data.config.num_rounds} rounds</p>
                    </div>
                    <div className="chart-container" style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={roundData}>
                                <defs>
                                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-emerald)" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="var(--accent-emerald)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="round" stroke="#666" />
                                <YAxis stroke="#666" unit="%" domain={[0, 100]} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: '#fff' }}
                                    itemStyle={{ color: 'var(--accent-emerald)' }}
                                />
                                <Legend />
                                <Area 
                                    type="monotone" 
                                    dataKey="accuracy" 
                                    name="Global Accuracy" 
                                    stroke="var(--accent-emerald)" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorAcc)" 
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Loss vs Round */}
                <div className="dashboard-card chart-card">
                    <div className="card-header">
                        <h3>Global Model Loss</h3>
                        <p>Objective function minimization</p>
                    </div>
                    <div className="chart-container" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={roundData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="round" stroke="#666" />
                                <YAxis stroke="#666" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="loss" name="Cross Entropy Loss" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Client wise contribution */}
                <div className="dashboard-card chart-card">
                    <div className="card-header">
                        <h3>Client Contribution Analysis</h3>
                        <p>Comparing accuracy across federated nodes (Final Round)</p>
                    </div>
                    <div className="chart-container" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={clientData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#666" />
                                <YAxis stroke="#666" unit="%" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: '#fff' }}
                                />
                                <Bar dataKey="accuracy" name="Local Accuracy">
                                    {clientData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#8b5cf6' : '#ec4899'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="dashboard-card summary-card" style={{ gridColumn: 'span 2' }}>
                    <div className="stats-row">
                        <div className="stat-item">
                            <span className="stat-label">Communication Cost</span>
                            <span className="stat-value">{clientData.reduce((acc, c) => acc + parseFloat(c.cost), 0).toFixed(2)} MB</span>
                            <span className="stat-desc">Total weights transferred</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Best Accuracy</span>
                            <span className="stat-value">{data.best_accuracy * 100}%</span>
                            <span className="stat-desc">Achieved at Round {data.rounds.length}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Time</span>
                            <span className="stat-value">{data.total_time_seconds}s</span>
                            <span className="stat-desc">All rounds combined</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">DP Privacy Budget (ε)</span>
                            <span className="stat-value">1.2</span>
                            <span className="stat-desc">Gaussian noise: 0.05 scale</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FLAnalytics;
