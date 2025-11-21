import React from 'react'
import Scene from './components/Scene'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
    return (
        <ErrorBoundary>
            <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
                <Scene />
            </div>
        </ErrorBoundary>
    )
}

export default App
