import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import FlipBookPage from "./pages/FlipBookPage";

// Lazy-loaded pages — not needed on initial load
const YearbookPage = lazy(() => import("./pages/YearbookPage"));
const StudentPage = lazy(() => import("./pages/StudentPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdminYearbooksPage = lazy(() => import("./pages/admin/AdminYearbooksPage"));
const AdminStudentsPage = lazy(() => import("./pages/admin/AdminStudentsPage"));
const AdminAnalyticsPage = lazy(() => import("./pages/admin/AdminAnalyticsPage"));
const BookmarksPage = lazy(() => import("./pages/BookmarksPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/yearbook/:year" element={<FlipBookPage />} />

        <Route path="/admin/login" element={
          <Suspense fallback={<LoadingFallback />}><LoginPage /></Suspense>
        } />
        <Route path="/admin/register" element={
          <Suspense fallback={<LoadingFallback />}><RegisterPage /></Suspense>
        } />

        <Route path="/yearbook/:slug" element={
          <Suspense fallback={<LoadingFallback />}><YearbookPage /></Suspense>
        } />
        <Route path="/student/:id" element={
          <Suspense fallback={<LoadingFallback />}><StudentPage /></Suspense>
        } />
        <Route path="/search" element={
          <Suspense fallback={<LoadingFallback />}><SearchPage /></Suspense>
        } />
        <Route path="/bookmarks" element={
          <Suspense fallback={<LoadingFallback />}><BookmarksPage /></Suspense>
        } />
        <Route path="/dashboard" element={
          <Suspense fallback={<LoadingFallback />}><DashboardPage /></Suspense>
        } />
        <Route path="/admin/yearbooks" element={
          <Suspense fallback={<LoadingFallback />}><AdminYearbooksPage /></Suspense>
        } />
        <Route path="/admin/students" element={
          <Suspense fallback={<LoadingFallback />}><AdminStudentsPage /></Suspense>
        } />
        <Route path="/admin/analytics" element={
          <Suspense fallback={<LoadingFallback />}><AdminAnalyticsPage /></Suspense>
        } />
        <Route path="*" element={
          <Suspense fallback={<LoadingFallback />}><NotFoundPage /></Suspense>
        } />
      </Route>
    </Routes>
  );
}

function LoadingFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#e94560] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
