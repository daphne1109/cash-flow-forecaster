import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/app.css'

// StrictMode intentionally surfaces unsafe side effects during development.
// The forecast domain is designed to remain pure regardless of this check.
createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
