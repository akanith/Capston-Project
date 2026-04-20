import { useState, useEffect } from 'react';
import { MdFolder, MdPhoto, MdPieChart, MdBarChart, MdWarning, MdSearch, MdLayers } from 'react-icons/md';
import { getDatasetStats } from '../services/api';

function DatasetExplorer() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const result = await getDatasetStats();
            setData(result);
        } catch (err) {
            setError('Could not load dataset stats. Ensure the archive folder exists.');
        } finally {
            setLoading(false);
        }
    };

    const s = {
        card: {
            background: 'linear-gradient(135deg, rgba(15,12,28,0.9) 0%, rgba(25,20,45,0.9) 100%)',
            border: '1px solid rgba(168,85,247,0.12)', borderRadius: '16px', padding: '22px',
        },
        glowCard: {
            background: 'linear-gradient(135deg, rgba(15,12,28,0.95) 0%, rgba(25,20,45,0.95) 100%)',
            border: '1px solid rgba(168,85,247,0.18)', borderRadius: '16px', padding: '22px',
            boxShadow: '0 0 30px rgba(168,85,247,0.05)',
        },
        label: {
            fontSize: '10px', color: 'rgba(168,85,247,0.7)', textTransform: 'uppercase',
            letterSpacing: '1.5px', fontWeight: 700, marginBottom: '14px',
        },
    };

    const colors = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#eab308'];
    const getColor = (i) => colors[i % colors.length];

    if (loading) return (
        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid rgba(16,185,129,0.15)', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span className="breathe-anim" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Scanning dataset...</span>
        </div>
    );

    const maxCount = data ? Math.max(...data.classes.map(c => c.count)) : 1;

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="slide-up" style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div className="pop-in float-anim" style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                    }}>
                        <MdLayers style={{ color: '#fff', fontSize: '20px' }} />
                    </div>
                    <div>
                        <h2 className="shimmer-text" style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>Dataset Explorer</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Analyze class distribution, sample images, and detect dataset imbalance</p>
                    </div>
                </div>
            </div>

            {error && <div className="slide-up" style={{ padding: '14px 18px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '12px', color: '#f43f5e', fontSize: '13px', marginBottom: '20px' }}>⚠ {error}</div>}

            {data && (
                <>
                    {/* Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '20px' }}>
                        {[
                            { label: 'Classes', value: data.total_classes, icon: <MdFolder />, color: '#a855f7' },
                            { label: 'Images', value: data.total_images.toLocaleString(), icon: <MdPhoto />, color: '#3b82f6' },
                            { label: 'Avg / Class', value: data.avg_per_class, icon: <MdBarChart />, color: '#10b981' },
                            { label: 'Imbalance', value: `${data.imbalance_ratio}x`, icon: <MdPieChart />, color: data.is_imbalanced ? '#f43f5e' : '#10b981' },
                            { label: 'Source', value: data.data_source, icon: <MdSearch />, color: '#f59e0b' },
                        ].map((stat, i) => (
                            <div key={i} className={`slide-up anim-delay-${i + 1} hover-lift`} style={s.glowCard}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <div className="pop-in" style={{
                                        width: '30px', height: '30px', borderRadius: '8px',
                                        background: `${stat.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: stat.color, fontSize: '16px', animationDelay: `${0.2 + i * 0.1}s`,
                                    }}>{stat.icon}</div>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{stat.label}</span>
                                </div>
                                <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', animation: 'countUp 0.5s ease forwards', animationDelay: `${0.4 + i * 0.1}s` }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    {data.is_imbalanced && (
                        <div className="slide-up anim-delay-6" style={{
                            padding: '14px 18px', background: 'rgba(245,158,11,0.06)',
                            border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px',
                            color: '#f59e0b', fontSize: '13px', marginBottom: '20px',
                            display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600,
                        }}>
                            <MdWarning size={18} /> Dataset is imbalanced (ratio: {data.imbalance_ratio}x). Consider data augmentation.
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>
                        {/* Bar Chart */}
                        <div className="slide-up anim-delay-7 hover-glow" style={s.glowCard}>
                            <div style={s.label}>Class Distribution</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
                                {data.classes.map((cls, i) => (
                                    <div key={cls.name}
                                        onClick={() => setSelectedClass(selectedClass === cls.name ? null : cls.name)}
                                        className="hover-scale"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                                            padding: '7px 10px', borderRadius: '8px',
                                            background: selectedClass === cls.name ? `${getColor(i)}08` : 'transparent',
                                            border: selectedClass === cls.name ? `1px solid ${getColor(i)}25` : '1px solid transparent',
                                        }}>
                                        <span style={{
                                            fontSize: '12px', color: 'var(--text-secondary)', width: '90px', flexShrink: 0,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600,
                                        }}>{cls.name}</span>
                                        <div style={{ flex: 1, height: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', overflow: 'hidden' }}>
                                            <div className="bar-fill-anim" style={{
                                                width: `${(cls.count / maxCount) * 100}%`, height: '100%',
                                                background: `linear-gradient(90deg, ${getColor(i)}80, ${getColor(i)})`,
                                                borderRadius: '6px', animationDelay: `${0.3 + i * 0.04}s`,
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, width: '36px', textAlign: 'right' }}>{cls.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="slide-right anim-delay-8 hover-glow" style={s.card}>
                                <div style={s.label}>Dataset Proportions</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {data.classes.slice(0, 12).map((cls, i) => (
                                        <div key={cls.name} className={`pop-in anim-delay-${Math.min(i + 1, 12)} hover-scale`} style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '5px 10px', borderRadius: '100px',
                                            background: `${getColor(i)}08`, fontSize: '11px',
                                            border: `1px solid ${getColor(i)}15`, cursor: 'pointer',
                                        }}
                                            onClick={() => setSelectedClass(selectedClass === cls.name ? null : cls.name)}
                                        >
                                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: getColor(i) }} />
                                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{cls.name}</span>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{Math.round(cls.count / data.total_images * 100)}%</span>
                                        </div>
                                    ))}
                                    {data.classes.length > 12 && (
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '5px 10px' }}>+{data.classes.length - 12} more</span>
                                    )}
                                </div>
                            </div>

                            <div className="slide-right anim-delay-10 hover-glow" style={s.glowCard}>
                                <div style={s.label}>
                                    Sample Images {selectedClass && <span style={{ color: '#10b981' }}>— {selectedClass}</span>}
                                </div>
                                {selectedClass ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {(data.classes.find(c => c.name === selectedClass)?.samples || []).map((src, i) => (
                                            <div key={i} className={`scale-in anim-delay-${i + 1}`} style={{
                                                borderRadius: '10px', overflow: 'hidden', aspectRatio: '1',
                                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                            }}>
                                                <img src={src} alt={selectedClass} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={e => { e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:11px">No image</div>'; }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="float-anim" style={{ textAlign: 'center', padding: '30px 0' }}>
                                        <MdPhoto style={{ fontSize: '36px', color: 'rgba(255,255,255,0.08)', marginBottom: '8px' }} />
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Click a class to view samples</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default DatasetExplorer;
