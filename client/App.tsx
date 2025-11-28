import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Articles from "./pages/Articles";
import ArticleDetail from "./pages/ArticleDetail";
import Authors from "./pages/Authors";
import AuthorProfile from "./pages/AuthorProfile";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ReaderDashboard from "./pages/dashboard/reader/Index";
import AuthorDashboard from "./pages/dashboard/author/Index";
import AdminDashboard from "./pages/dashboard/admin/Index";
import AdminUsers from "./pages/dashboard/admin/Users";
import AdminArticles from "./pages/dashboard/admin/Articles";
import AdminCourses from "./pages/dashboard/admin/Courses";
import AdminRecognition from "./pages/dashboard/admin/Recognition";
import AdminPayments from "./pages/dashboard/admin/Payments";
import AdminSettings from "./pages/dashboard/admin/Settings";
import ReaderSubscriptionsPage from "./pages/dashboard/reader/Subscriptions";
import AuthorSettings from "./pages/dashboard/author/Settings";
import ReaderSettings from "./pages/dashboard/reader/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/:id" element={<ArticleDetail />} />
        <Route path="/authors" element={<Authors />} />
        <Route path="/authors/:id" element={<AuthorProfile />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard/reader" element={<ReaderDashboard />} />
        <Route path="/dashboard/reader/subscriptions" element={<ReaderSubscriptionsPage />} />
        <Route path="/dashboard/reader/settings" element={<ReaderSettings />} />
        <Route path="/dashboard/author" element={<AuthorDashboard />} />
        <Route path="/dashboard/author/settings" element={<AuthorSettings />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/admin/users" element={<AdminUsers />} />
        <Route path="/dashboard/admin/articles" element={<AdminArticles />} />
        <Route path="/dashboard/admin/courses" element={<AdminCourses />} />
        <Route path="/dashboard/admin/recognition" element={<AdminRecognition />} />
        <Route path="/dashboard/admin/payments" element={<AdminPayments />} />
        <Route path="/dashboard/admin/settings" element={<AdminSettings />} />
        <Route path="/account/subscriptions" element={<ReaderSubscriptionsPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [location.pathname]);
  return null;
}
