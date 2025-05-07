// src/main.tsx (Updated)
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'; // <-- Import the provider
import { Toaster } from "@/components/ui/toaster" // Keep if needed

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider> {/* <-- Wrap App here */}
      <App />
    </AuthProvider>
    <Toaster />
  </React.StrictMode>,
)