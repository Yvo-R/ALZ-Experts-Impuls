import React, { useState, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Vector3, Quaternion, Euler } from 'three'
import { easing } from 'maath'
import { Html } from '@react-three/drei'
import { v4 as uuidv4 } from 'uuid'
import Frame from './Frame'
import Sidebar from './Sidebar'
import { saveFrameData, getAllFramesData, deleteFrameData } from '../utils/db'

const INITIAL_FRAMES = [
  { id: 1, position: [0, 0, 0], rotation: [0, 0, 0], title: "Welcome", url: "/vite.svg", type: 'image' },
  { id: 2, position: [8, 2, -15], rotation: [0, -0.4, 0], title: "Concept", url: "/vite.svg", type: 'image' },
  { id: 3, position: [-8, -2, -30], rotation: [0, 0.4, 0], title: "Features", url: "/vite.svg", type: 'image' },
  { id: 4, position: [8, 4, -45], rotation: [0.2, -0.2, 0], title: "Tech Stack", url: "/vite.svg", type: 'image' },
  { id: 5, position: [0, 0, -60], rotation: [0, 0, 0], title: "Thank You", url: "/vite.svg", type: 'image' },
]

export default function Presentation() {
  const [frames, setFrames] = useState(INITIAL_FRAMES)
  const [index, setIndex] = useState(0)
  const { camera } = useThree()

  useEffect(() => {
    const loadFrames = async () => {
      try {
        const dbFrames = await getAllFramesData()
        if (dbFrames && dbFrames.length > 0) {
          // Merge DB frames with initial frames or replace if ID structure matches
          // For simplicity, if DB has frames, use them. If not, use initial.
          // But we need to handle the case where we added new frames.
          // Let's just trust the DB if it has data.

          const processedFrames = dbFrames.map(savedFrame => {
            let url = savedFrame.url
            if (savedFrame.url instanceof Blob) {
              url = URL.createObjectURL(savedFrame.url)
            }

            // Check if this is one of the initial frames and override position/rotation
            // to ensure the new layout is applied even if old positions were saved.
            const initialFrame = INITIAL_FRAMES.find(f => f.id === savedFrame.id)
            if (initialFrame) {
              return {
                ...savedFrame,
                url,
                position: initialFrame.position,
                rotation: initialFrame.rotation
              }
            }

            // Ensure essential properties exist for custom frames
            const position = savedFrame.position || [0, 0, 0]
            const rotation = savedFrame.rotation || [0, 0, 0]
            return { ...savedFrame, url, position, rotation }
          })

          // Sort by ID or some order if needed, but DB usually returns in insertion order or key order.
          // Since we use numeric IDs for initial and UUIDs for new, let's just use the array.
          setFrames(processedFrames)
        }
      } catch (error) {
        console.error("Failed to load frames from DB:", error)
      }
    }
    loadFrames()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setIndex((prev) => (prev + 1) % frames.length)
      } else if (e.key === 'ArrowLeft') {
        setIndex((prev) => (prev - 1 + frames.length) % frames.length)
      } else if (e.key === 'Home') {
        setIndex(0)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [frames.length])

  useFrame((state, delta) => {
    const frame = frames[index]
    if (!frame || !frame.position || !frame.rotation) return

    const fPos = new Vector3(...frame.position)
    const fRot = new Euler(...frame.rotation)
    const fQuat = new Quaternion().setFromEuler(fRot)

    const offset = new Vector3(0, 0, 4)
    offset.applyQuaternion(fQuat)
    const targetPos = fPos.clone().add(offset)

    // Use maath for smooth damping with less drift
    easing.damp3(state.camera.position, targetPos, 0.4, delta)
    easing.dampQ(state.camera.quaternion, fQuat, 0.4, delta)
  })

  const handleUpdate = async (id, content, type) => {
    console.log("handleUpdate called", id, type)
    let displayUrl = content
    let filename = content

    // If content is a File object (from upload), create a blob URL for display
    if (content instanceof File || content instanceof Blob) {
      displayUrl = URL.createObjectURL(content)
      filename = content.name // Store filename
    } else if (type === 'youtube') {
      filename = `YouTube: ${content}`
    }

    const updatedFrames = frames.map(f => f.id === id ? { ...f, url: displayUrl, type, filename } : f)
    setFrames(updatedFrames)

    // Save to DB
    try {
      const frameToSave = updatedFrames.find(f => f.id === id)
      // We need to save the original content (File/Blob) not the object URL
      await saveFrameData({ ...frameToSave, url: content })
    } catch (error) {
      console.error("Failed to save frame to DB:", error)
    }
  }

  const handleUpdateTitle = async (id, newTitle) => {
    console.log("handleUpdateTitle called", id, newTitle)
    const updatedFrames = frames.map(f => f.id === id ? { ...f, title: newTitle } : f)
    setFrames(updatedFrames)

    try {
      const frameToSave = updatedFrames.find(f => f.id === id)
      // We need to ensure we pass the original Blob if it exists, but here we only changed title.
      // The state 'url' might be a blob URL. We should ideally fetch the blob from DB or keep it in memory.
      // BUT, saveFrameData overwrites. If we pass a blob URL string, we lose the blob.
      // This is a tricky part of the persistence implementation.
      // Simplified fix: We only update the title field in DB if possible, or we need to re-save the whole object.
      // Since we don't have the original blob in state (only the URL), we might overwrite with the URL string.
      // However, for this task, let's assume the user won't refresh immediately after changing title before re-uploading.
      // BETTER: We should probably store the raw blob in state too if we want to re-save it.
      // OR: We can just update the title in the DB without touching the URL.
      // Let's try to just update the title by reading the existing record first.

      const existing = await getAllFramesData().then(data => data.find(f => f.id === id))
      if (existing) {
        await saveFrameData({ ...existing, title: newTitle })
      }
    } catch (error) {
      console.error("Failed to update title in DB:", error)
    }
  }

  const handleDeleteFrame = async (id) => {
    if (frames.length <= 1) return // Prevent deleting the last frame

    const newFrames = frames.filter(f => f.id !== id)
    setFrames(newFrames)

    // Adjust index if necessary
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
    // Use a larger Z-step for new frames to match the new layout style
    const newPosition = [
      lastFrame.position[0] + (Math.random() * 12 - 6), // Slightly wider X spread
      lastFrame.position[1] + (Math.random() * 6 - 3),  // Slightly wider Y spread
      lastFrame.position[2] - 15 // Move back by 15 units instead of 10
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
    setIndex(frames.length) // Switch to new frame

    try {
      await saveFrameData(newFrame)
    } catch (error) {
      console.error("Failed to save new frame:", error)
    }
  }

  const handleInsertFrame = async (afterIndex) => {
    const prevFrame = frames[afterIndex]

    // Calculate spacing/offset for the new frame
    // We use the same logic as add: random X/Y spread, Z -15
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

    // Create new array with inserted frame
    const newFrames = [...frames]
    newFrames.splice(afterIndex + 1, 0, newFrame)

    // Shift all subsequent frames
    for (let i = afterIndex + 2; i < newFrames.length; i++) {
      const f = newFrames[i]
      f.position = [
        f.position[0] + offset[0],
        f.position[1] + offset[1],
        f.position[2] + offset[2]
      ]
    }

    setFrames(newFrames)
    setIndex(afterIndex + 1) // Switch to new frame

    // Save ALL frames to DB to persist the shift
    // This might be heavy if there are many frames, but necessary for spatial consistency
    try {
      await Promise.all(newFrames.map(f => saveFrameData(f)))
    } catch (error) {
      console.error("Failed to save frames after insert:", error)
    }
  }

  return (
    <group>
      <Html fullscreen style={{ pointerEvents: 'none' }}>
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
      </Html>

      {frames.map((frame, i) => (
        <Frame
          key={frame.id}
          {...frame}
          isActive={i === index}
          onClick={() => setIndex(i)}
        // Frame no longer needs onUpdate for its own UI, but we keep it clean
        />
      ))}
    </group>
  )
}
