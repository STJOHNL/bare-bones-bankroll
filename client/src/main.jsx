import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/normalize.css'
import './styles/index.css'
import { UserProvider } from './context/UserContext.jsx'
import { BankrollProvider } from './context/BankrollContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <UserProvider>
        <BankrollProvider>
          <App />
        </BankrollProvider>
      </UserProvider>
    </ThemeProvider>
  </React.StrictMode>
)
