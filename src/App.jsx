import React, { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Scene from './components/Scene'
import Sidebar from './components/Sidebar'
import ErrorBoundary from './components/ErrorBoundary'
import { saveFrameData, getAllFramesData, deleteFrameData } from './utils/db'

const INITIAL_FRAMES = [
    { id: 1, position: [0, 0, 0], rotation: [0, 0, 0], title: "Welcome", url: "/vite.svg", type: 'image' },
    { id: 2, position: [8, 2, -15], rotation: [0, -0.4, 0], title: "Concept", url: "/vite.svg", type: 'image' },
    { id: 3, position: [-8, -2, -30], rotation: [0, 0.4, 0], title: "Features", url: "/vite.svg", type: 'image' },
    { id: 4, position: [8, 4, -45], rotation: [0.2, -0.2, 0], title: "Tech Stack", url: "/vite.svg", type: 'image' },
    { id: 5, position: [0, 0, -60], rotation: [0, 0, 0], title: "Thank You", url: "/vite.svg", type: 'image' },
]

function App() {
    const [frames, setFrames] = useState(INITIAL_FRAMES)
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const loadFrames = async () => {
            try {
                const dbFrames = await getAllFramesData()
                if (dbFrames && dbFrames.length > 0) {
                    const processedFrames = dbFrames.map(savedFrame => {
                        let url = savedFrame.url
                        if (savedFrame.url instanceof Blob) {
                            url = URL.createObjectURL(savedFrame.url)
                        } else if (typeof savedFrame.url === 'string' && savedFrame.url.startsWith('blob:')) {
                            console.warn("Recovered from stale blob URL for frame:", savedFrame.id)
                            url = "/vite.svg"
                        }

                        const initialFrame = INITIAL_FRAMES.find(f => f.id === savedFrame.id)
                        if (initialFrame) {
                            return {
                                ...savedFrame,
                                url,
                                position: initialFrame.position,
                                rotation: initialFrame.rotation
                            }
                        }

                        const position = savedFrame.position || [0, 0, 0]
                        const rotation = savedFrame.rotation || [0, 0, 0]
                        return { ...savedFrame, url, position, rotation }
                    })
                    setFrames(processedFrames)
                }
            } catch (error) {
                console.error("Failed to load frames from DB:", error)
            }
        }
        loadFrames()
    }, [])

    const handleUpdate = async (id, content, type) => {
        let displayUrl = content
        let filename = content

        if (content instanceof File || content instanceof Blob) {
            displayUrl = URL.createObjectURL(content)
            filename = content.name
        } else if (type === 'youtube') {
            filename = `YouTube: ${content}`
        }

        const updatedFrames = frames.map(f => f.id === id ? { ...f, url: displayUrl, type, filename } : f)
        setFrames(updatedFrames)

        try {
            const frameToSave = updatedFrames.find(f => f.id === id)
            await saveFrameData({ ...frameToSave, url: content })
        } catch (error) {
            console.error("Failed to save frame to DB:", error)
        }
    }

    const handleUpdateTitle = async (id, newTitle) => {
        const updatedFrames = frames.map(f => f.id === id ? { ...f, title: newTitle } : f)
        setFrames(updatedFrames)

        try {
            const existing = await getAllFramesData().then(data => data.find(f => f.id === id))
            if (existing) {
                await saveFrameData({ ...existing, title: newTitle })
            }
        } catch (error) {
            console.error("Failed to update title in DB:", error)
        }
    }

    const handleDeleteFrame = async (id) => {
        if (frames.length <= 1) return

        const newFrames = frames.filter(f => f.id !== id)
        setFrames(newFrames)

        if (index >= newFrames.length) {
            setIndex(newFrames.length - 1)
        }

        try {
            await deleteFrameData(id)
        } catch (error) {
            console.error("Failed to delete frame from DB:", error)
        }
    }

    const handleAddFrame = async () => {
        const lastFrame = frames[frames.length - 1]
        const newPosition = [
            lastFrame.position[0] + (Math.random() * 12 - 6),
            lastFrame.position[1] + (Math.random() * 6 - 3),
            lastFrame.position[2] - 15
        ]
        const newRotation = [
            Math.random() * 0.4 - 0.2,
            Math.random() * 0.4 - 0.2,
            0
        ]

        const newFrame = {
            id: uuidv4(),
            position: newPosition,
            rotation: newRotation,
            title: "New Slide",
            url: "/vite.svg",
            type: 'image'
        }

        setFrames([...frames, newFrame])

        try {
            await saveFrameData(newFrame)
        } catch (error) {
            console.error("Failed to save new frame:", error)
        }
    }

    const handleInsertFrame = async (afterIndex) => {
        const prevFrame = frames[afterIndex]
        const offset = [
            (Math.random() * 12 - 6),
            (Math.random() * 6 - 3),
            -15
        ]

        const newPosition = [
            prevFrame.position[0] + offset[0],
            prevFrame.position[1] + offset[1],
            prevFrame.position[2] + offset[2]
        ]

        const newRotation = [
            Math.random() * 0.4 - 0.2,
            Math.random() * 0.4 - 0.2,
            0
        ]

        const newFrame = {
            id: uuidv4(),
            position: newPosition,
            rotation: newRotation,
            title: "New Slide",
            url: "/vite.svg",
            type: 'image'
        }

        const newFrames = [...frames]
        newFrames.splice(afterIndex + 1, 0, newFrame)

        for (let i = afterIndex + 2; i < newFrames.length; i++) {
            const f = newFrames[i]
            f.position = [
                f.position[0] + offset[0],
                f.position[1] + offset[1],
                f.position[2] + offset[2]
            ]
        }

        setFrames(newFrames)

        try {
            const dbFrames = await getAllFramesData()
            const framesToSave = newFrames.map(stateFrame => {
                const dbFrame = dbFrames.find(dbf => dbf.id === stateFrame.id)
                const url = dbFrame ? dbFrame.url : stateFrame.url
                return { ...stateFrame, url }
            })
            await Promise.all(framesToSave.map(f => saveFrameData(f)))
        } catch (error) {
            console.error("Failed to save frames after insert:", error)
        }
    }

    return (
        <ErrorBoundary>
            <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
                <Sidebar
                    frames={frames}
                    onUpdate={handleUpdate}
                    onUpdateTitle={handleUpdateTitle}
                    onAdd={handleAddFrame}
                    onDelete={handleDeleteFrame}
                    onInsert={handleInsertFrame}
                    onSelect={setIndex}
                    activeIndex={index}
                />
                <Scene frames={frames} index={index} setIndex={setIndex} />
            </div>
        </ErrorBoundary>
    )
}

export default App
