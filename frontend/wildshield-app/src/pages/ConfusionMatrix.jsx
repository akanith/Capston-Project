import { useState, useEffect } from 'react';
import { MdGridOn, MdDownload } from 'react-icons/md';
import { getMetrics } from '../services/api';

function ConfusionMatrix() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            const data = await getMetrics();
            setMetrics(data.evaluation_metrics);
        } catch {
            console.log('Metrics not available');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner"></div><p>Loading validation data...</p></div>;

    if (!metrics) {
        return (
            <div className="fade-in">
                <div className="page-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '22px', borderRight: '1px solid var(--border-color)', paddingRight: '16px', marginRight: '16px' }}>Confusion Matrix & Performance</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Run model evaluation first to generate metrics.</p>
                </div>
            </div>
        );
    }

    const cm = metrics.confusion_matrix;
    const classes = metrics.class_names;
    const perClass = metrics.per_class_metrics;

    // Top 5 classes by support (for small demo in "Per-Class Accuracy" block)
    const topClasses = [...classes].sort((a, b) => perClass[b].support - perClass[a].support).slice(0, 5);

    // Normalize CM relative to max value for colors
    const flattened = cm.flat();
    const maxVal = Math.max(...flattened, 1);

    // Function to get "WildShield-FL" heatmap colors (dark background, bright purple highlights)
    const getColor = (val) => {
        if (val === 0) return 'rgba(255,255,255,0.02)';
        const ratio = val / maxVal;
        // Low: very dark violet, High: bright neon violet
        if (ratio > 0.8) return 'var(--accent-purple)';
        if (ratio > 0.4) return 'rgba(168, 85, 247, 0.6)';
        if (ratio > 0.1) return 'rgba(168, 85, 247, 0.3)';
        return 'rgba(168, 85, 247, 0.1)';
    };

    return (
        <div className="fade-in">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Confusion Matrix & Performance</h2>
                <p style={{ color: 'var(--text-muted)' }}>Comprehensive evaluation of the federated global model across all distributed validation nodes.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '24px', marginBottom: '24px' }}>
                {/* Prediction Heatmap */}
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MdGridOn style={{ color: 'var(--accent-purple)' }} />
                            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Prediction Heatmap</h3>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MdDownload /> Download CSV
                        </span>
                    </div>

                    <div style={{ background: '#0a0710', borderRadius: '12px', padding: '16px', overflowX: 'auto', border: '1px solid var(--border-color)' }}>
                        {/* Rendering a subset of classes if > 15 to make it look like the mockup, or all if small */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: `60px repeat(${Math.min(classes.length, 12)}, minmax(32px, 1fr))`,
                            gap: '4px',
                            minWidth: `${Math.min(classes.length, 12) * 36 + 70}px`
                        }}>
                            <div></div>
                            {classes.slice(0, 12).map((cls, i) => (
                                <div key={i} style={{
                                    writingMode: 'vertical-rl', textAlign: 'left', padding: '4px 2px',
                                    color: 'var(--text-muted)', fontSize: '9px', height: '60px',
                                    transform: 'rotate(180deg)', textTransform: 'uppercase', letterSpacing: '1px'
                                }}>
                                    {cls.substring(0, 6)}
                                </div>
                            ))}

                            {classes.slice(0, 12).map((rowCls, rowIdx) => (
                                <div key={`row-${rowIdx}`} style={{ display: 'contents' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', color: 'var(--text-muted)',
                                        fontSize: '9px', paddingRight: '12px', justifyContent: 'flex-end', textTransform: 'uppercase', letterSpacing: '1px'
                                    }}>
                                        {rowCls.substring(0, 6)}
                                    </div>
                                    {cm[rowIdx].slice(0, 12).map((val, colIdx) => {
                                        const ratio = val / maxVal;
                                        return (
                                            <div key={`${rowIdx}-${colIdx}`} style={{
                                                background: getColor(val),
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                minHeight: '32px', color: ratio > 0.4 ? '#fff' : 'var(--text-secondary)',
                                                fontWeight: ratio > 0.4 ? 700 : 500, fontSize: '11px',
                                                borderRadius: '4px'
                                            }}>
                                                {val}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Per-Class Accuracy */}
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '14px' }}>
                                <div style={{ width: '3px', height: '8px', background: 'var(--accent-purple)' }}></div>
                                <div style={{ width: '3px', height: '12px', background: 'var(--accent-purple)' }}></div>
                                <div style={{ width: '3px', height: '14px', background: 'var(--accent-purple)' }}></div>
                            </div>
                            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Per-Class Accuracy</h3>
                        </div>
                        <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            AVG {(metrics.overall_accuracy * 100).toFixed(1)}%
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginTop: '32px' }}>
                        {topClasses.map(cls => {
                            const acc = (perClass[cls].accuracy * 100) || 0;
                            return (
                                <div key={cls}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{cls}</span>
                                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{acc.toFixed(0)}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                        <div style={{ width: `${acc}%`, height: '100%', background: 'var(--accent-purple)', borderRadius: '3px' }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Classification Report Table */}
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Classification Report</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', background: 'none' }}>CLASS NAME</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', background: 'none' }}>PRECISION</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', background: 'none' }}>RECALL</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', background: 'none' }}>F1 SCORE</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', background: 'none', textAlign: 'right' }}>SUPPORT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map((cls, i) => {
                                const m = perClass[cls];
                                return (
                                    <tr key={cls} style={{ borderBottom: i === classes.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-primary)' }}>{cls}</td>
                                        <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>{m.precision.toFixed(2)}</td>
                                        <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>{m.recall.toFixed(2)}</td>
                                        <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--accent-pink)', fontWeight: 600 }}>{m.f1_score.toFixed(2)}</td>
                                        <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'right' }}>{m.support.toLocaleString()}</td>
                                    </tr>
                                );
                            })}
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>Weighted Avg</td>
                                <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{metrics.macro_precision.toFixed(2)}</td>
                                <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{metrics.macro_recall.toFixed(2)}</td>
                                <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--accent-pink)', fontWeight: 600 }}>{metrics.macro_f1.toFixed(2)}</td>
                                <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'right' }}>{metrics.total_test_samples.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginTop: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                WildShield-FL Federated Analysis Tooling © 2026
            </div>
        </div>
    );
}

export default ConfusionMatrix;
