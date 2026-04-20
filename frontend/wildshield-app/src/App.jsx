import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import "leaflet/dist/leaflet.css";
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import FederatedLearningPrediction from './pages/FederatedLearningPrediction';
import YoloImageDetection from './pages/YoloImageDetection';
import YoloVideoDetection from './pages/YoloVideoDetection';
import WebcamDetection from './pages/WebcamDetection';
import FederatedMetrics from './pages/FederatedMetrics';
import ConfusionMatrix from './pages/ConfusionMatrix';
import ModelComparison from './pages/ModelComparison';
import FedAvgExplanation from './pages/FedAvgExplanation';
import GradCAM from './pages/GradCAM';
import FederatedClients from './pages/FederatedClients';
import ErrorAnalysis from './pages/ErrorAnalysis';
import DatasetExplorer from './pages/DatasetExplorer';
import FLAnalytics from './pages/FLAnalytics';
import MapView from './pages/MapView';
import ActiveLearning from './pages/ActiveLearning';
import AlertSystem from './pages/AlertSystem';
import EdgeMetrics from './pages/EdgeMetrics';


function App() {
    return (
        <Router>
            <div className="app-layout">
                <Sidebar />
                <Header />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/predict" element={<FederatedLearningPrediction />} />
                        <Route path="/yolo-image" element={<YoloImageDetection />} />
                        <Route path="/yolo-video" element={<YoloVideoDetection />} />
                        <Route path="/webcam" element={<WebcamDetection />} />
                        <Route path="/metrics" element={<FederatedMetrics />} />
                        <Route path="/confusion" element={<ConfusionMatrix />} />
                        <Route path="/comparison" element={<ModelComparison />} />
                        <Route path="/fedavg" element={<FedAvgExplanation />} />
                        <Route path="/gradcam" element={<GradCAM />} />
                        <Route path="/fed-clients" element={<FederatedClients />} />
                        <Route path="/error-analysis" element={<ErrorAnalysis />} />
                        <Route path="/dataset" element={<DatasetExplorer />} />
                        <Route path="/fl-analytics" element={<FLAnalytics />} />
                        <Route path="/map" element={<MapView />} />
                        <Route path="/active-learning" element={<ActiveLearning />} />
                        <Route path="/alerts" element={<AlertSystem />} />
                        <Route path="/edge-metrics" element={<EdgeMetrics />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
