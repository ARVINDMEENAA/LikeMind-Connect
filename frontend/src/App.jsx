import { Routes, Route } from 'react-router-dom';
import * as Pages from './pages';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import EmailVerification from './components/EmailVerification';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Pages.Home />} />
        <Route path="/about" element={<Pages.About />} />
        <Route path="/features" element={<Pages.Features />} />
        <Route path="/faq" element={<Pages.FAQ />} />
        <Route path="/login" element={<Pages.Login />} />
        <Route path="/signup" element={<Pages.Signup />} />
        <Route path="/forgot-password" element={<Pages.ForgotPassword />} />
        <Route path="/reset-password" element={<Pages.ResetPassword />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Pages.Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile-setup" element={<Pages.ProfileSetup />} />
        <Route path="/find-connections" element={<Pages.FindConnections />} />
        <Route path="/edit-profile" element={<Pages.EditProfile />} />
        <Route path="/chat" element={<Pages.Chat />} />
        <Route path="/chat/:userId" element={<Pages.Chat />} />
        <Route path="/match/:id" element={<Pages.MatchDetails />} />
        <Route path="/notifications" element={<Pages.Notifications />} />

      </Routes>
    </Layout>
  );
}

export default App;