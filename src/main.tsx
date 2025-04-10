import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import SystemProvider from './components/providers/SystemProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SystemProvider>
        <App />
      </SystemProvider>
    </BrowserRouter>
  </StrictMode>,
)
