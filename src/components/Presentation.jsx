import React, { useState, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Vector3, Quaternion, Euler } from 'three'
import { easing } from 'maath'
import Frame from './Frame'

const INITIAL_FRAMES = [
  { id: 1, position: [0, 0, 0], rotation: [0, 0, 0], title: "Welcome", url: "/vite.svg", type: 'image' },
  { id: 2, position: [5, 2, -5], rotation: [0, -0.5, 0], title: "Concept", url: "/vite.svg", type: 'image' },
  { id: 3, position: [-5, -2, -10], rotation: [0, 0.5, 0], title: "Features", url: "/vite.svg", type: 'image' },
  { id: 4, position: [0, 5, -15], rotation: [0.5, 0, 0], title: "Tech Stack", url: "/vite.svg", type: 'image' },
  { id: 5, position: [0, 0, -20], rotation: [0, 0, 0], title: "Thank You", url: "/vite.svg", type: 'image' },
]

export default function Presentation() {
  const [frames, setFrames] = useState(INITIAL_FRAMES)
  const [index, setIndex] = useState(0)
  const { camera } = useThree()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setIndex((prev) => (prev + 1) % frames.length)
      } else if (e.key === 'ArrowLeft') {
        setIndex((prev) => (prev - 1 + frames.length) % frames.length)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [frames.length])

  useFrame((state, delta) => {
    const frame = frames[index]

    const fPos = new Vector3(...frame.position)
    const fRot = new Euler(...frame.rotation)
    const fQuat = new Quaternion().setFromEuler(fRot)

    const offset = new Vector3(0, 0, 6)
    offset.applyQuaternion(fQuat)
    const targetPos = fPos.clone().add(offset)

    // Use maath for smooth damping with less drift
    easing.damp3(state.camera.position, targetPos, 0.4, delta)
    easing.dampQ(state.camera.quaternion, fQuat, 0.4, delta)
  })

  const handleUpdate = (id, newUrl, type) => {
    setFrames(frames.map(f => f.id === id ? { ...f, url: newUrl, type } : f))
  }

  return (
    <group>
      {frames.map((frame, i) => (
        <Frame
          key={frame.id}
          {...frame}
          isActive={i === index}
          onClick={() => setIndex(i)}
          onUpdate={(url, type) => handleUpdate(frame.id, url, type)}
        />
      ))}
    </group>
  )
}
