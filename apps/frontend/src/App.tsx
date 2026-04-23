import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserKiosk from './modules/user/UserKiosk';

function App() {
  return (
    <Router>
      <Routes>
        {/* Kalau buka alamat web/user, munculin alur kiosk */}
        <Route path="/user/*" element={<UserKiosk />} />

        {/* Kalau orang cuma buka alamat web doang, langsung lempar ke user */}
        <Route path="/" element={<Navigate to="/user" />} />
      </Routes>
    </Router>
  );
}

export default App;