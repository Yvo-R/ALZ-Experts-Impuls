import React, { useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Vector3, Quaternion, Euler } from 'three'
import { easing } from 'maath'
import Frame from './Frame'

export default function Presentation({ frames, index, setIndex }) {
  const { camera } = useThree()

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
  }, [frames.length, setIndex])

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

  return (
    <group>
      {frames.map((frame, i) => (
        <Frame
          key={frame.id}
          {...frame}
          isActive={i === index}
          onClick={() => setIndex(i)}
        />
      ))}
    </group>
  )
}
