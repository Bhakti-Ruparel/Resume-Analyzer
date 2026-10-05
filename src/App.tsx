import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Dataset from './pages/Dataset';
import Preprocessing from './pages/Preprocessing';
import Models from './pages/Models';
import Evaluation from './pages/Evaluation';
import ErrorAnalysis from './pages/ErrorAnalysis';
import FinalPipeline from './pages/FinalPipeline';
import Predict from './pages/Predict';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="dataset" element={<Dataset />} />
          <Route path="preprocessing" element={<Preprocessing />} />
          <Route path="models" element={<Models />} />
          <Route path="evaluation" element={<Evaluation />} />
          <Route path="errors" element={<ErrorAnalysis />} />
          <Route path="pipeline" element={<FinalPipeline />} />
          <Route path="predict" element={<Predict />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
