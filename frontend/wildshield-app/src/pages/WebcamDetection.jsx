import { useState, useRef, useCallback, useEffect } from 'react';
import { MdCameraAlt, MdStop, MdPlayArrow, MdRefresh, MdFiberManualRecord, MdPets, MdTimeline, MdSpeed } from 'react-icons/md';
import { webcamDetection } from '../services/api';

function WebcamDetection() {
    const [isRunning, setIsRunning] = useState(false);
    const [detections, setDetections] = useState([]);
    const [objectCounts, setObjectCounts] = useState({});
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);
    const [confThreshold, setConfThreshold] = useState(0.15);
    const [totalDetected, setTotalDetected] = useState(0);
    const [highestConf, setHighestConf] = useState(null);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [videoDims, setVideoDims] = useState({ w: 640, h: 480 });

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);
    const isRunningRef = useRef(false);  // Sync ref to avoid stale closures
    const confRef = useRef(0.15);

    // Keep refs in sync with state
    useEffect(() => { confRef.current = confThreshold; }, [confThreshold]);

    const captureFrame = () => {
        if (!videoRef.current || !canvasRef.current) return null;
        const video = videoRef.current;
        if (video.videoWidth === 0 || video.readyState < 2) return null;

        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
    };

    const runDetectionLoop = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(async () => {
            if (!isRunningRef.current) return;

            const frame = captureFrame();
            if (!frame) {
                console.log('No frame captured, video not ready yet...');
                return;
            }

            try {
                const data = await webcamDetection(frame, confRef.current);
                console.log('Webcam API response:', JSON.stringify(data).slice(0, 200));
                const dets = data.detections || [];
                setDetections(dets);
                setObjectCounts(data.object_counts || {});

                if (dets.length > 0) {
                    setTotalDetected(prev => prev + dets.length);

                    const maxDet = dets.reduce((a, b) => a.confidence > b.confidence ? a : b);
                    setHighestConf(prev => {
                        if (!prev || maxDet.confidence > prev.confidence) return maxDet;
                        return prev;
                    });

                    setHistory(prev => {
                        const newEntries = dets.map(d => ({
                            id: Date.now() + Math.random(),
                            class: d.class,
                            confidence: d.confidence,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
                        }));
                        return [...newEntries, ...prev].slice(0, 20);
                    });
                }
            } catch (err) {
                console.error('Webcam detection error:', err);
            }
        }, 1500);
    };

    const startWebcam = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    setVideoDims({
                        w: videoRef.current.videoWidth || 640,
                        h: videoRef.current.videoHeight || 480
                    });
                };
            }

            // Use ref so the detection loop sees the update immediately
            isRunningRef.current = true;
            setIsRunning(true);
            setModelLoaded(true);

            // Give the video a moment to start, then begin detection
            setTimeout(() => {
                runDetectionLoop();
            }, 1500);
        } catch (err) {
            setError('Could not access webcam. Please allow camera access.');
        }
    };

    const stopWebcam = () => {
        isRunningRef.current = false;
        setIsRunning(false);
        setDetections([]);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    const resetDetections = () => {
        setDetections([]);
        setObjectCounts({});
        setHistory([]);
        setTotalDetected(0);
        setHighestConf(null);
    };

    useEffect(() => {
        return () => stopWebcam();
    }, []);


    const currentCount = detections.length;

    // Styles
    const cardStyle = {
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
    };

    const labelStyle = {
        fontSize: '10px',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontWeight: 600,
        marginBottom: '12px',
    };

    const statusDot = (active) => ({
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: active ? '#10b981' : '#64748b',
        boxShadow: active ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none',
        display: 'inline-block',
    });

    return (
        <div className="fade-in">
            {/* Page Header */}
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Live Webcam Detection</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Real-time animal detection using YOLOv8 and your webcam feed.</p>
            </div>

            {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#f43f5e', fontSize: '13px', marginBottom: '20px' }}>
                    ⚠ {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>

                {/* ====== LEFT: Live Camera Feed ====== */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{
                        ...cardStyle,
                        padding: 0,
                        overflow: 'hidden',
                        position: 'relative',
                        minHeight: '500px',
                        backgroundColor: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {/* Live Badge */}
                        {isRunning && (
                            <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 20, display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(244, 63, 94, 0.15)', padding: '5px 12px', borderRadius: '100px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                                <MdFiberManualRecord style={{ fontSize: '10px', color: '#f43f5e', animation: 'pulse 1.5s infinite' }} />
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f43f5e', letterSpacing: '1px' }}>LIVE</span>
                            </div>
                        )}

                        {/* Offline Placeholder */}
                        {!isRunning && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', position: 'absolute', zIndex: 10 }}>
                                <MdCameraAlt style={{ fontSize: '48px', color: 'var(--text-muted)', opacity: 0.4 }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Camera is offline</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Press "Start Camera" to begin</p>
                            </div>
                        )}

                        {/* Video Element */}
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: isRunning ? 'block' : 'none',
                            }}
                        />

                        {/* Bounding Boxes */}
                        {isRunning && detections.map((d, i) => {
                            if (!d.bbox) return null;
                            const left = (d.bbox.x1 / videoDims.w) * 100;
                            const top = (d.bbox.y1 / videoDims.h) * 100;
                            const width = ((d.bbox.x2 - d.bbox.x1) / videoDims.w) * 100;
                            const height = ((d.bbox.y2 - d.bbox.y1) / videoDims.h) * 100;

                            return (
                                <div key={i} style={{
                                    position: 'absolute', left: `${left}%`, top: `${top}%`,
                                    width: `${width}%`, height: `${height}%`,
                                    border: '2px solid #a855f7',
                                    boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)',
                                    borderRadius: '3px', pointerEvents: 'none', zIndex: 15,
                                }}>
                                    <div style={{
                                        position: 'absolute', top: '-22px', left: '-1px',
                                        background: '#a855f7', color: '#fff',
                                        fontSize: '10px', fontWeight: 700,
                                        padding: '3px 8px', borderRadius: '4px 4px 4px 0',
                                        whiteSpace: 'nowrap', textTransform: 'uppercase',
                                    }}>
                                        {d.class} {d.confidence}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Controls Bar */}
                    <div style={{ ...cardStyle, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {!isRunning ? (
                                <button onClick={startWebcam} style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 24px', background: '#a855f7', color: '#fff',
                                    border: 'none', borderRadius: '8px', fontSize: '13px',
                                    fontWeight: 600, cursor: 'pointer',
                                }}>
                                    <MdPlayArrow size={18} /> Start Camera
                                </button>
                            ) : (
                                <button onClick={stopWebcam} style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 24px', background: 'rgba(244, 63, 94, 0.15)',
                                    color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)',
                                    borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                }}>
                                    <MdStop size={18} /> Stop Camera
                                </button>
                            )}
                            <button onClick={resetDetections} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 20px', background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-secondary)', border: '1px solid var(--border-color)',
                                borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                            }}>
                                <MdRefresh size={16} /> Reset
                            </button>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Polling: 1.2s interval
                        </div>
                    </div>
                </div>

                {/* ====== RIGHT: Detection Info Panel ====== */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Status Card */}
                    <div style={cardStyle}>
                        <div style={labelStyle}>Detection Status</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Camera</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={statusDot(isRunning)}></span>
                                    <span style={{ fontSize: '13px', color: isRunning ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                                        {isRunning ? 'Active' : 'Stopped'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Model</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={statusDot(modelLoaded)}></span>
                                    <span style={{ fontSize: '13px', color: modelLoaded ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                                        {modelLoaded ? 'YOLOv8 Loaded' : 'Not Loaded'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detected Objects */}
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={labelStyle}>Detected Animals</div>
                            <span style={{ fontSize: '11px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', padding: '3px 10px', borderRadius: '100px', fontWeight: 700 }}>
                                {currentCount} found
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                            {detections.length > 0 ? detections.map((d, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 12px', background: 'rgba(255,255,255,0.02)',
                                    borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <MdPets style={{ color: '#a855f7', fontSize: '16px' }} />
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{d.class}</span>
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>{d.confidence}%</span>
                                </div>
                            )) : (
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                                    {isRunning ? 'Scanning for animals...' : 'Start camera to detect'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Statistics Card */}
                    <div style={cardStyle}>
                        <div style={labelStyle}>Detection Statistics</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Detected</span>
                                <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{totalDetected}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Current Frame</span>
                                <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{currentCount}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Highest Confidence</span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                                    {highestConf ? `${highestConf.class} ${highestConf.confidence}%` : '--'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Confidence Threshold */}
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={labelStyle}>Confidence Threshold</div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#a855f7' }}>{Math.round(confThreshold * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0.1" max="0.9" step="0.05"
                            value={confThreshold}
                            onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                            style={{ width: '100%', accentColor: '#a855f7' }}
                        />
                    </div>

                    {/* Detection History Log */}
                    <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '220px' }}>
                        <div style={labelStyle}>Detection History</div>
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {history.length > 0 ? history.map((h) => (
                                <div key={h.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '6px 10px', fontSize: '12px',
                                    background: 'rgba(255,255,255,0.02)', borderRadius: '6px',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '11px' }}>{h.time}</span>
                                        <span style={{ color: '#fff', fontWeight: 600 }}>{h.class}</span>
                                    </div>
                                    <span style={{ color: '#10b981', fontWeight: 600 }}>{h.confidence}%</span>
                                </div>
                            )) : (
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                                    No detections logged yet
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}

export default WebcamDetection;
