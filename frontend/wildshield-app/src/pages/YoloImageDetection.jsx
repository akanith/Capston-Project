import { useState, useRef } from 'react';
import { 
    MdCloudUpload, MdSearch, MdBarChart, MdCheckCircleOutline, 
    MdFlashOn, MdCategory, MdDownload, MdAdd, MdShield, 
    MdReportProblem, MdCheckCircle
} from 'react-icons/md';
import { detectYoloImage } from '../services/api';

function YoloImageDetection() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const f = e.target.files[0];
        if (f) {
            setFile(f);
            setResult(null);
            setError(null);
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target.result);
            reader.readAsDataURL(f);

            // Auto-detect on file select
            handleDetect(f);
        }
    };

    const handleDetect = async (fileToProcess) => {
        if (!fileToProcess) return;
        setLoading(true);
        setError(null);
        try {
            const data = await detectYoloImage(fileToProcess);
            setResult(data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Detection failed. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    // Derived stats
    const totalDetections = result ? result.total_detections : 0;
    const maxConf = result?.detections?.length > 0
        ? Math.max(...result.detections.map(d => parseFloat(d.confidence))) * 100
        : 0;
    const classesFound = result ? Object.keys(result.object_counts || {}).length : 0;
    const inferenceTime = result?.inference_ms ? `${result.inference_ms.toFixed(0)}ms` : '0ms';

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>YOLO Image Intelligence</h2>
                    <p style={{ color: 'var(--text-muted)' }}>High-precision wildlife scanning and threat detection layer.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => { setFile(null); setPreview(null); setResult(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--accent-purple)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)' }}>
                        <MdAdd /> New Analysis
                    </button>
                </div>
            </div>

            {/* Intelligence Status Bar */}
            {(loading || result) && (
                <div className="glass-card" style={{ 
                    padding: '12px 24px', 
                    marginBottom: '24px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    border: result?.poaching_alert ? '1px solid var(--accent-rose)' : '1px solid var(--border-color)',
                    background: result?.poaching_alert ? 'rgba(244, 63, 94, 0.05)' : 'rgba(255,255,255,0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {loading ? (
                            <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                        ) : result?.poaching_alert ? (
                            <MdReportProblem style={{ color: 'var(--accent-rose)', fontSize: '20px' }} />
                        ) : (
                            <MdShield style={{ color: 'var(--accent-emerald)', fontSize: '20px' }} />
                        )}
                        <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px', color: result?.poaching_alert ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                            {loading ? 'AI INTELLIGENCE ENGINE SCANNING...' : (result?.poaching_alert ? '⚠️ CRITICAL THREAT DETECTED: POTENTIAL POACHING' : '✅ AREA SECURE: NO THREATS IDENTIFIED')}
                        </span>
                    </div>
                </div>
            )}

            {/* Top Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                <div className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Animals Detected</span>
                        <MdBarChart style={{ color: 'var(--accent-purple)' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: baseline, gap: '8px' }}>
                        <span style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>{result ? totalDetections : '-'}</span>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Max Confidence</span>
                        <MdCheckCircleOutline style={{ color: 'var(--accent-purple)' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: baseline, gap: '8px' }}>
                        <span style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>{result ? `${maxConf.toFixed(0)}%` : '-'}</span>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Inference Time</span>
                        <MdFlashOn style={{ color: 'var(--accent-purple)' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: baseline, gap: '8px' }}>
                        <span style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>{result ? inferenceTime : '-'}</span>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Species Found</span>
                        <MdCategory style={{ color: 'var(--accent-purple)' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: baseline, gap: '8px' }}>
                        <span style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>{result ? classesFound : '-'}</span>
                    </div>
                </div>
            </div>

            {error && (
                <div style={{ marginBottom: '24px', padding: '14px 20px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--accent-rose)', fontSize: '14px' }}>
                    ⚠️ {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Upload Zone (condensed if file exists) */}
                    {!result && (
                        <div
                            className="glass-card"
                            style={{
                                padding: preview ? '24px' : '60px 24px',
                                border: '1px dashed rgba(168, 85, 247, 0.4)',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: 'rgba(10, 7, 16, 0.6)',
                                transition: 'all 0.3s'
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFileSelect({ target: { files: [f] } }); }}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <MdCloudUpload style={{ fontSize: '24px' }} />
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                                {preview ? 'Change Source' : 'Upload Source Image'}
                            </h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Wildlife monitoring frame (JPG, PNG)</p>
                        </div>
                    )}

                    {/* Image Previews */}
                    {preview && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontWeight: 700 }}>INPUT FRAME</h4>
                                <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={preview} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.8 }} />
                                </div>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '11px', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontWeight: 700 }}>AI ANNOTATED OUTPUT</h4>
                                <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    {loading ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                            <div className="spinner" style={{ width: '32px', height: '32px', borderTopColor: 'var(--accent-purple)' }}></div>
                                        </div>
                                    ) : result ? (
                                        <img src={`data:image/jpeg;base64,${result.annotated_image}`} alt="Output" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Awaiting analysis</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Observations */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', height: 'fit-content' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                        <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Areal Observations
                        </h3>
                    </div>

                    <div style={{ padding: '24px', flex: 1 }}>
                        {result ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {Object.entries(result.object_counts || {}).map(([cls, count], idx) => {
                                    const classDets = result.detections.filter(d => d.class === cls);
                                    const avgConf = classDets.reduce((acc, obj) => acc + parseFloat(obj.confidence), 0) / (classDets.length || 1);
                                    const dotColor = ['var(--accent-emerald)', 'var(--accent-cyan)', 'var(--accent-purple)', 'var(--accent-amber)'][idx % 4];

                                    return (
                                        <div key={cls}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor }}></div>
                                                    <span style={{ fontSize: '14px', fontWeight: 600, textTransform: 'capitalize' }}>{cls}</span>
                                                </div>
                                                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{count} found</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                                    <div style={{ width: `${avgConf * 100}%`, height: '100%', background: dotColor, borderRadius: '3px' }}></div>
                                                </div>
                                                <span style={{ fontSize: '12px', color: dotColor, fontWeight: 700, minWidth: '40px' }}>{(avgConf * 100).toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
                                <MdShield size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                                <p style={{ fontSize: '13px' }}>Scan an image to identify species and threats.</p>
                            </div>
                        )}
                    </div>

                    {result && (
                        <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Re-upload Frame
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const baseline = 'baseline'; // helper for styles

export default YoloImageDetection;
