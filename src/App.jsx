import React, { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Scene from './components/Scene'
import Sidebar from './components/Sidebar'
import ErrorBoundary from './components/ErrorBoundary'
import { saveFrameData, getAllFramesData, deleteFrameData, saveSettings, getSettings } from './utils/db'

const INITIAL_FRAMES = [
    { id: 1, position: [0, 0, 0], rotation: [0, 0, 0], title: "Welcome", url: "/vite.svg", type: 'image' },
    { id: 2, position: [8, 2, -15], rotation: [0, -0.4, 0], title: "Concept", url: "/vite.svg", type: 'image' },
    { id: 3, position: [-8, -2, -30], rotation: [0, 0.4, 0], title: "Features", url: "/vite.svg", type: 'image' },
    { id: 4, position: [8, 4, -45], rotation: [0.2, -0.2, 0], title: "Tech Stack", url: "/vite.svg", type: 'image' },
    { id: 5, position: [0, 0, -60], rotation: [0, 0, 0], title: "Thank You", url: "/vite.svg", type: 'image' },
]

const INITIAL_LOGOS = [
    { id: 'logo-1', url: '/assets/elaboratum.png' },
    { id: 'logo-2', url: '/assets/eidra.png' }
]

function App() {
    const [frames, setFrames] = useState(INITIAL_FRAMES)
    const [logos, setLogos] = useState(INITIAL_LOGOS)
    const [logoDistance, setLogoDistance] = useState(50)
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load Frames
                const dbFrames = await getAllFramesData()
                const validFrames = dbFrames.filter(f => !f.id.toString().startsWith('settings-'))

                if (validFrames && validFrames.length > 0) {
                    const processedFrames = validFrames.map(savedFrame => {
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

                // Load Logos
                const savedLogos = await getSettings('settings-logos')
                if (savedLogos) {
                    if (savedLogos.items) {
                        const processedLogos = savedLogos.items.map(l => {
                            let url = l.url
                            if (l.blob instanceof Blob) {
                                url = URL.createObjectURL(l.blob)
                            }
                            return { ...l, url }
                        })
                        setLogos(processedLogos)
                    }
                    if (savedLogos.distance !== undefined) {
                        setLogoDistance(savedLogos.distance)
                    }
                }

            } catch (error) {
                console.error("Failed to load data from DB:", error)
            }
        }
        loadData()
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

    const handleUpdateLogo = async (index, file) => {
        const newLogos = [...logos]
        const displayUrl = URL.createObjectURL(file)

        // Update state
        newLogos[index] = {
            ...newLogos[index],
            url: displayUrl,
            blob: file // Store blob for saving
        }
        setLogos(newLogos)

        // Save to DB
        try {
            // We save the array of logos AND the distance in the same settings object
            await saveSettings('settings-logos', { items: newLogos, distance: logoDistance })
        } catch (error) {
            console.error("Failed to save logos:", error)
        }
    }

    const handleUpdateLogoDistance = async (newDistance) => {
        setLogoDistance(newDistance)
        try {
            // Save to DB
            // We need to preserve the logos items when saving distance
            // But we don't have the blobs in state easily accessible if they were loaded from DB?
            // Actually, `logos` state has blobs if user uploaded, but might not if loaded from DB (unless we stored them).
            // `getSettings` returns the object we saved.
            // Let's just update the distance in the DB by merging.
            const currentSettings = await getSettings('settings-logos') || {}
            await saveSettings('settings-logos', { ...currentSettings, distance: newDistance })
        } catch (error) {
            console.error("Failed to save logo distance:", error)
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

    const getRandomRotation = () => {
        // 10 to 30 degrees in radians
        const minDeg = 10
        const maxDeg = 30
        const range = maxDeg - minDeg
        const deg = minDeg + Math.random() * range
        const rad = deg * (Math.PI / 180)
        return Math.random() > 0.5 ? rad : -rad
    }

    const handleAddFrame = async () => {
        const lastFrame = frames[frames.length - 1]

        // More dynamic path: larger X/Y offsets
        const xOffset = (Math.random() - 0.5) * 20 // +/- 10
        const yOffset = (Math.random() - 0.5) * 10 // +/- 5

        const newPosition = [
            lastFrame.position[0] + xOffset,
            lastFrame.position[1] + yOffset,
            lastFrame.position[2] - 15
        ]

        // Random rotation between 10-30 degrees for X and Y axes
        const newRotation = [
            getRandomRotation(), // X rotation
            getRandomRotation(), // Y rotation
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

        // More dynamic path: larger X/Y offsets
        const xOffset = (Math.random() - 0.5) * 20 // +/- 10
        const yOffset = (Math.random() - 0.5) * 10 // +/- 5

        const offset = [
            xOffset,
            yOffset,
            -15
        ]

        const newPosition = [
            prevFrame.position[0] + offset[0],
            prevFrame.position[1] + offset[1],
            prevFrame.position[2] + offset[2]
        ]

        // Random rotation between 10-30 degrees for X and Y axes
        const newRotation = [
            getRandomRotation(), // X rotation
            getRandomRotation(), // Y rotation
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

    const handleReorder = async (newOrder) => {
        // We want to keep the 3D positions/rotations fixed in space,
        // but change which slide occupies which slot.
        // So we take the positions/rotations from the OLD order and apply them to the NEW order.

        const reorderedFrames = newOrder.map((frame, i) => {
            const targetPosition = frames[i].position
            const targetRotation = frames[i].rotation
            return {
                ...frame,
                position: targetPosition,
                rotation: targetRotation
            }
        })

        setFrames(reorderedFrames)

        // Persist the new order and swapped positions
        try {
            // We need to save ALL frames because their positions/rotations might have changed
            // relative to their ID (effectively swapping places).
            // Also need to preserve Blobs as usual.
            const dbFrames = await getAllFramesData()
            const framesToSave = reorderedFrames.map(stateFrame => {
                const dbFrame = dbFrames.find(dbf => dbf.id === stateFrame.id)
                const url = dbFrame ? dbFrame.url : stateFrame.url
                return { ...stateFrame, url }
            })
            await Promise.all(framesToSave.map(f => saveFrameData(f)))
        } catch (error) {
            console.error("Failed to save reordered frames:", error)
        }
    }

    return (
        <ErrorBoundary>
            <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
                <Sidebar
                    frames={frames}
                    logos={logos}
                    logoDistance={logoDistance}
                    onUpdate={handleUpdate}
                    onUpdateTitle={handleUpdateTitle}
                    onUpdateLogo={handleUpdateLogo}
                    onUpdateLogoDistance={handleUpdateLogoDistance}
                    onAdd={handleAddFrame}
                    onDelete={handleDeleteFrame}
                    onInsert={handleInsertFrame}
                    onReorder={handleReorder}
                    onSelect={setIndex}
                    activeIndex={index}
                />
                <Scene frames={frames} logos={logos} logoDistance={logoDistance} index={index} setIndex={setIndex} />
            </div>
        </ErrorBoundary>
    )
}

export default App
