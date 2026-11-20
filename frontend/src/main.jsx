import "./polyfills.js"
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import AvisoServidor from './components/AvisoServidor.jsx'
import ErrorPantalla from './components/ErrorPantalla.jsx'
import { iniciarTema } from './utils/tema.js'

iniciarTema()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorPantalla>
      <AuthProvider>
        <App />
        <AvisoServidor />
      </AuthProvider>
    </ErrorPantalla>
  </StrictMode>,
)
