import { useState, useRef } from 'react';
import { MdCompareArrows, MdCloudUpload, MdInfoOutline, MdCheckCircle, MdBolt, MdPublic } from 'react-icons/md';
import { predictImage, detectYoloImage } from '../services/api';

function ModelComparison() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [resnetResult, setResnetResult] = useState(null);
    const [yoloResult, setYoloResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const f = e.target.files[0];
        if (f) {
            setFile(f);
            setResnetResult(null);
            setYoloResult(null);
            setError(null);
            const r = new FileReader();
            r.onload = (ev) => setPreview(ev.target.result);
            r.readAsDataURL(f);
        }
    };

    const handleCompare = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const [resnet, yolo] = await Promise.all([
                predictImage(file), detectYoloImage(file)
            ]);
            setResnetResult(resnet.prediction);
            setYoloResult(yolo);
        } catch (err) {
            setError('Comparison failed. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>Cross-Model Evaluation</h2>
                <p style={{ color: 'var(--text-muted)' }}>Side-by-side comparison of Federated ResNet18 (Classification) and YOLOv8 (Detection).</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Upload / Input View */}
                    <div
                        className="glass-card"
                        style={{
                            padding: (!file || resnetResult) ? '40px 24px' : '24px',
                            border: '1px dashed rgba(168, 85, 247, 0.4)',
                            textAlign: 'center',
                            background: 'rgba(10, 7, 16, 0.6)',
                            display: (!file || (!loading && !resnetResult)) ? 'block' : 'none'
                        }}
                    >
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <MdCloudUpload style={{ fontSize: '24px' }} />
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                            {file ? 'Image Ready: ' + file.name : 'Upload Analysis Source'}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Input image will be processed by both ResNet and YOLO models</p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                            <button onClick={() => fileInputRef.current?.click()} style={{ padding: '8px 24px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                                Change Image
                            </button>
                            {file && (
                                <button onClick={handleCompare} disabled={loading} style={{ padding: '8px 24px', background: 'var(--accent-purple)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)', opacity: loading ? 0.7 : 1 }}>
                                    {loading ? 'Running Inference...' : 'Perform Comparison'}
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: '14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--accent-rose)', fontSize: '14px' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Side-by-Side Results */}
                    {(resnetResult || yoloResult || loading) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* ResNet Column */}
                            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(16, 185, 129, 0.05)', color: 'var(--accent-emerald)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>ResNet18 / Federated</span>
                                    {resnetResult && <MdCheckCircle size={14} />}
                                </div>
                                <div style={{ background: '#000', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    {preview && <img src={preview} alt="Input" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: loading ? 0.4 : 1 }} />}
                                    {loading && <div className="spinner" style={{ position: 'absolute' }}></div>}
                                </div>
                                <div style={{ padding: '20px' }}>
                                    {resnetResult ? (
                                        <>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Classification Result</div>
                                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', textTransform: 'capitalize', marginBottom: '8px' }}>{resnetResult.predicted_class}</div>
                                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '12px' }}>
                                                <div style={{ width: `${resnetResult.confidence}%`, height: '100%', background: 'var(--accent-emerald)', borderRadius: '2px' }}></div>
                                            </div>
                                            <span style={{ fontSize: '12px', color: 'var(--accent-emerald)', fontWeight: 600 }}>{resnetResult.confidence}% Reliability</span>
                                        </>
                                    ) : (
                                        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Awaiting classification...</div>
                                    )}
                                </div>
                            </div>

                            {/* YOLO Column */}
                            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(14, 165, 233, 0.05)', color: 'var(--accent-cyan)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>YOLOv8 / Detection</span>
                                    {yoloResult && <MdCheckCircle size={14} />}
                                </div>
                                <div style={{ background: '#000', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    {yoloResult?.annotated_image ? (
                                        <img src={`data:image/jpeg;base64,${yoloResult.annotated_image}`} alt="YOLO" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : preview ? (
                                        <img src={preview} alt="Input" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.3 }} />
                                    ) : null}
                                    {loading && <div className="spinner" style={{ position: 'absolute' }}></div>}
                                </div>
                                <div style={{ padding: '20px' }}>
                                    {yoloResult ? (
                                        <>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Detections Found</div>
                                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{yoloResult.total_objects} Objects</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {yoloResult.detections?.slice(0, 3).map((d, i) => (
                                                    <span key={i} style={{ fontSize: '10px', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '40px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                                                        {d.class} {d.confidence}%
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Awaiting detection...</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Comparison Matrix */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '20px' }}>MODEL SPECIFICATIONS</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 700, marginBottom: '4px' }}>RESNET18 (FL)</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Privacy-first classification trained across distributed silos.</div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><MdBolt size={12} /> 12ms</span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><MdPublic size={12} /> Decentralized</span>
                                </div>
                            </div>

                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '4px' }}>YOLOv8 NANO</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Real-time spatial detection using one-stage architecture.</div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><MdBolt size={12} /> 8ms</span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><MdCheckCircle size={12} /> Bbox Output</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '16px' }}>WHY TWO MODELS?</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            ResNet18 captures **global features** for species identification under strict privacy. YOLOv8 provides **spatial context** for tracking and localization.
                        </p>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="glass-card" style={{ marginTop: '24px', padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MdInfoOutline className="text-purple" />
                    <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Technical Capability Matrix</h3>
                </div>
                <table className="data-table">
                    <thead>
                        <tr><th>Capability</th><th>Federated ResNet</th><th>YOLOv8 Nano</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Primary Task</td><td>Species Classification</td><td>Spatial Detection</td></tr>
                        <tr><td>Privacy Layer</td><td>FedAvg (Strong)</td><td>Not Native</td></tr>
                        <tr><td>Output Format</td><td>Label Probabilities</td><td>Coord + Label</td></tr>
                        <tr><td>Speed (Inference)</td><td>Fast (~15ms)</td><td>Ultra-Fast (~8ms)</td></tr>
                        <tr><td>Dataset Focus</td><td>31 Wildlife Species</td><td>80 General Classes</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ModelComparison;
