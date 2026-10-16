import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute, AdminRoute } from './layouts/ProtectedRoute';

// Public pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LanguageSelectPage } from './pages/LanguageSelectPage';
import { LevelOverviewPage } from './pages/LevelOverviewPage';
import { QuestionListPage } from './pages/QuestionListPage';
import { PracticeWorkspacePage } from './pages/PracticeWorkspacePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Authenticated user pages
import { DashboardPage } from './pages/DashboardPage';
import { UploadQuestionPage } from './pages/UploadQuestionPage';
import { MyQuestionsPage } from './pages/MyQuestionsPage';
import { MySubmissionsPage } from './pages/MySubmissionsPage';
import { UserProfilePage } from './pages/UserProfilePage';

// Admin pages
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLevelsPage } from './pages/AdminLevelsPage';
import { AdminReportedQuestionsPage } from './pages/AdminReportedQuestionsPage';
import { AdminQuestionReviewPage } from './pages/AdminQuestionReviewPage';
import { AdminAuditPage } from './pages/AdminAuditPage';

export function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/languages" element={<LanguageSelectPage />} />
        <Route path="/languages/:languageSlug/levels" element={<LevelOverviewPage />} />
        <Route path="/levels/:levelId/questions" element={<QuestionListPage />} />
        <Route path="/practice/:questionId" element={<PracticeWorkspacePage />} />

        {/* Authenticated User Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadQuestionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-questions"
          element={
            <ProtectedRoute>
              <MyQuestionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/submissions"
          element={
            <ProtectedRoute>
              <MySubmissionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Protected Administrator Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="levels" element={<AdminLevelsPage />} />
          <Route path="reported" element={<AdminReportedQuestionsPage />} />
          <Route path="questions/:id" element={<AdminQuestionReviewPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
