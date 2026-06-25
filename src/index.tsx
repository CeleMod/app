import { createRoot } from 'react-dom/client'
import App from './App'
// @ts-ignore
import './globals.css'

async function init() {
  // F5 reload
  window.addEventListener('keyup', (evt) => {
    if (evt.code === 'F5') {
      window.location.reload()
    }
  })

  const root = document.getElementById('root')!
  createRoot(root).render(<App />)
}

init()
