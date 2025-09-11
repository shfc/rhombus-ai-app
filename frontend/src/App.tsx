import { useState } from 'react';
import './App.css';
import rhombusAILogo from './assets/RhombusAI.svg';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <a href="https://rhombusai.com" target="_blank">
          <img
            src={rhombusAILogo}
            className="logo react"
            alt="Rhombus AI logo"
          />
        </a>
      </div>
      <h1>Rhombus AI APP</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
    </>
  );
}

export default App;
