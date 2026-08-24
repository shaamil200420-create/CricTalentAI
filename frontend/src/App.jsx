import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

import AuthLayout from './layouts/AuthLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import CoachLayout from './layouts/CoachLayout.jsx';
import PlayerLayout from './layouts/PlayerLayout.jsx';

import Login from './pages/auth/Login.jsx';

import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminManagement from './pages/admin/AdminManagement.jsx';
import CoachManagement from './pages/admin/CoachManagement.jsx';
import PlayerManagement from './pages/admin/PlayerManagement.jsx';
import TournamentManagement from './pages/admin/TournamentManagement.jsx';
import ScheduleManagement from './pages/admin/ScheduleManagement.jsx';
import AdminReports from './pages/admin/Reports.jsx';
import AdminSettings from './pages/admin/Settings.jsx';

import CoachDashboard from './pages/coach/Dashboard.jsx';
import CoachPlayers from './pages/coach/Players.jsx';
import MatchEntry from './pages/coach/MatchEntry.jsx';
import MatchRecords from './pages/coach/MatchRecords.jsx';
import TrainingEntry from './pages/coach/TrainingEntry.jsx';
import CoachScheduleManagement from './pages/coach/ScheduleManagement.jsx';
import Comparison from './pages/coach/Comparison.jsx';
import AIPredictions from './pages/coach/AIPredictions.jsx';
import Recommendations from './pages/coach/Recommendations.jsx';
import DevelopmentPlans from './pages/coach/DevelopmentPlans.jsx';
import Goals from './pages/coach/Goals.jsx';
import CoachReports from './pages/coach/Reports.jsx';

import PlayerDashboard from './pages/player/Dashboard.jsx';
import MyProfile from './pages/player/MyProfile.jsx';
import MyMatchStats from './pages/player/MyMatchStats.jsx';
import MyTrainingRecords from './pages/player/MyTrainingRecords.jsx';
import MySchedule from './pages/player/MySchedule.jsx';
import MyGoals from './pages/player/MyGoals.jsx';
import MyFeedback from './pages/player/MyFeedback.jsx';
import MyDevelopmentReport from './pages/player/MyDevelopmentReport.jsx';
import MyTrainingProgress from './pages/player/MyTrainingProgress.jsx';

export default function App() {
  const { session } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={session ? `/${session.role}` : '/login'} replace />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route
        path="/admin"
        element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}
      >
        <Route index element={<AdminDashboard />} />
        <Route path="admins" element={<AdminManagement />} />
        <Route path="coaches" element={<CoachManagement />} />
        <Route path="players" element={<PlayerManagement />} />
        <Route path="tournaments" element={<TournamentManagement />} />
        <Route path="schedules" element={<ScheduleManagement />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route
        path="/coach"
        element={<ProtectedRoute role="coach"><CoachLayout /></ProtectedRoute>}
      >
        <Route index element={<CoachDashboard />} />
        <Route path="players" element={<CoachPlayers />} />
        <Route path="match-entry" element={<MatchEntry />} />
        <Route path="match-records" element={<MatchRecords />} />
        <Route path="training-entry" element={<TrainingEntry />} />
        <Route path="schedules" element={<CoachScheduleManagement />} />
        <Route path="comparison" element={<Comparison />} />
        <Route path="ai-predictions" element={<AIPredictions />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="development-plans" element={<DevelopmentPlans />} />
        <Route path="goals" element={<Goals />} />
        <Route path="reports" element={<CoachReports />} />
      </Route>

      <Route
        path="/player"
        element={<ProtectedRoute role="player"><PlayerLayout /></ProtectedRoute>}
      >
        <Route index element={<PlayerDashboard />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="matches" element={<MyMatchStats />} />
        <Route path="training" element={<MyTrainingRecords />} />
        <Route path="schedule" element={<MySchedule />} />
        <Route path="goals" element={<MyGoals />} />
        <Route path="feedback" element={<MyFeedback />} />
        <Route path="development-report" element={<MyDevelopmentReport />} />
        <Route path="training-progress" element={<MyTrainingProgress />} />
      </Route>

      <Route path="*" element={<Navigate to={session ? `/${session.role}` : '/login'} replace />} />
    </Routes>
  );
}
