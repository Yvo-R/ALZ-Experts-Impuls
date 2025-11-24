import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { TextureLoader, DoubleSide } from 'three'
import { Billboard } from '@react-three/drei'

function FloatingLogo({ url, position, baseSize, speed }) {
  const ref = useRef()
  const [texture, setTexture] = useState(null)
  const [aspect, setAspect] = useState(1)

  // Load texture manually to handle dynamic URLs and get aspect ratio
  useEffect(() => {
    if (!url) return
    const loader = new TextureLoader()
    loader.load(url, (tex) => {
      setTexture(tex)
      if (tex.image) {
        setAspect(tex.image.width / tex.image.height)
      }
    })
  }, [url])

  // Random initial phase
  const phase = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime() + phase
    // Float up/down
    ref.current.position.y = position[1] + Math.sin(t * speed) * 0.5
    // Float left/right slightly
    ref.current.position.x = position[0] + Math.cos(t * speed * 0.5) * 0.5
  })

  if (!texture) return null

  return (
    <Billboard position={position} follow={true} lockX={false} lockY={false} lockZ={false}>
      <mesh ref={ref} scale={[baseSize * aspect, baseSize, 1]}>
        <planeGeometry />
        <meshBasicMaterial
          map={texture}
          transparent
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </Billboard>
  )
}

export default function LogoField({ logos, distance = 50 }) {
  const groupRef = useRef()

  // Define fixed positions or random positions for the 2 logos
  const logoData = useMemo(() => {
    if (!logos) return []
    return logos.map((logo, i) => {
      // Place them at opposite sides of the sphere roughly
      const angle = (i / logos.length) * Math.PI * 2
      // Use the dynamic distance prop
      const radius = distance
      const x = Math.cos(angle) * radius
      // Scale height/depth with distance to keep relative proportions or keep fixed?
      // Let's scale them a bit so they don't bunch up vertically if distance is huge
      const y = (Math.random() - 0.5) * (distance * 0.5)
      const z = (Math.random() - 0.5) * distance - (distance * 0.5) // Push back

      return {
        ...logo,
        position: [x, y, z],
        baseSize: 2.0, // Increased size as requested
        speed: 0.2
      }
    })
  }, [logos, distance])

  useFrame((state, delta) => {
    // Rotate the entire group slowly
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * 0.03
      groupRef.current.rotation.y += delta * 0.01
    }
  })

  if (!logos) return null

  return (
    <group ref={groupRef}>
      {logoData.map((data, i) => (
        <FloatingLogo
          key={data.id || i}
          url={data.url}
          position={data.position}
          baseSize={data.baseSize}
          speed={data.speed}
        />
      ))}
    </group>
  )
}
