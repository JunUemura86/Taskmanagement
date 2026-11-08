import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// index.html の <div id="root"> が見つからないときは、原因が分かるように止める
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('index.html に id="root" の要素がありません')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
