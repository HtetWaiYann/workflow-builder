import { useState } from 'react'
import { GREETING } from '@workflow-builder/shared'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>Workflow Builder</h1>
      <p className="shared-greeting">{GREETING}</p>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        Count: {count}
      </button>
    </div>
  )
}

export default App
