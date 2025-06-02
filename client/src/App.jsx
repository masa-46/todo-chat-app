// client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TodoPage from './pages/TodoPage';
import LoginPage from './pages/LoginPage'; // 既存のログインページがあれば

function App() {
  const token = localStorage.getItem('accessToken');

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={token ? <Navigate to="/todos" /> : <LoginPage />}
        />
        <Route
          path="/todos"
          element={token ? <TodoPage /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
