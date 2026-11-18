import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import AvisoServidor from './components/AvisoServidor.jsx'
import { iniciarTema } from './utils/tema.js'

iniciarTema()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <AvisoServidor />
    </AuthProvider>
  </StrictMode>,
)
