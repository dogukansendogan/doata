import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import Search from './pages/Search';
import Category from './pages/Category';
import TagPage from './pages/TagPage';
import Author from './pages/Author';
import Bookmarks from './pages/Bookmarks';
import Archive from './pages/Archive';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminComments from './pages/admin/AdminComments';
import EditPost from './pages/admin/EditPost';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <ToastProvider>
      <AuthProvider>
        {isAdminRoute ? (
          <Routes>
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/comments" element={
              <ProtectedRoute requireAdmin>
                <AdminComments />
              </ProtectedRoute>
            } />
            <Route path="/admin/edit/:id" element={
              <ProtectedRoute requireAdmin>
                <EditPost />
              </ProtectedRoute>
            } />
          </Routes>
        ) : (
          <div className="app-wrapper">
            <Header />
            <KeyboardShortcutsModal />
            <main className="main-content">
              <div className="container">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/arama" element={<Search />} />
                  <Route path="/post/:id" element={<PostDetail />} />
                  <Route path="/kategori/:slug" element={<Category />} />
                  <Route path="/etiket/:tag" element={<TagPage />} />
                  <Route path="/yazar/:name" element={<Author />} />
                  <Route path="/arsiv" element={<Archive />} />

                  {/* Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* User Routes (giriş gerekli) */}
                  <Route path="/kaydedilenler" element={
                    <ProtectedRoute>
                      <Bookmarks />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />

                  {/* Admin-Only Routes */}
                  <Route path="/create" element={
                    <ProtectedRoute requireAdmin>
                      <CreatePost />
                    </ProtectedRoute>
                  } />
                </Routes>
              </div>
            </main>
            <Footer />
          </div>
        )}
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
