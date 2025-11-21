import React, { useRef, useState, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Image, useCursor, Html, useVideoTexture } from '@react-three/drei'
import { motion } from 'framer-motion-3d'

function VideoPlane({ url }) {
    const texture = useVideoTexture(url)
    return (
        <mesh scale={[4, 2.25, 1]}>
            <planeGeometry />
            <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
    )
}

export default function Frame({ id, position, rotation, url, type = 'image', title, isActive, onClick, onUpdate, ...props }) {
    const ref = useRef()
    const [hovered, setHover] = useState(false)
    useCursor(hovered)

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const newUrl = URL.createObjectURL(file)
            const newType = file.type.startsWith('video') ? 'video' : 'image'
            onUpdate(newUrl, newType)
        }
    }

    return (
        <group {...props}>
            <motion.group
                position={position}
                rotation={rotation}
                scale={isActive ? 1.2 : 1}
                animate={{
                    scale: isActive ? 1.1 : 1,
                }}
                transition={{ duration: 0.8 }}
                onClick={onClick}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                {/* Frame Border */}
                <mesh position={[0, 0, -0.1]}>
                    <boxGeometry args={[4.25, 2.5, 0.05]} />
                    <meshStandardMaterial color={isActive ? "#00aaff" : "#333"} emissive={isActive ? "#0044aa" : "#000"} />
                </mesh>

                {/* Content Area */}
                <Suspense fallback={<mesh><boxGeometry args={[4, 2.25, 0.01]} /><meshStandardMaterial color="black" /></mesh>}>
                    {type === 'video' ? (
                        <group position={[0, 0, 0.01]}>
                            <VideoPlane url={url} />
                        </group>
                    ) : (
                        <Image url={url} scale={[4, 2.25]} transparent opacity={0.9} position={[0, 0, 0.01]} />
                    )}
                </Suspense>

                {/* Title */}
                <Text
                    position={[0, 1.4, 0.06]}
                    fontSize={0.2}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                >
                    {title}
                </Text>

                {/* Edit UI */}
                {isActive && (
                    <Html position={[1.9, -1.0, 0.2]} transform center scale={0.2}>
                        <div style={{
                            background: 'rgba(0, 170, 255, 0.4)',
                            backdropFilter: 'blur(8px)',
                            padding: '12px 24px',
                            borderRadius: '30px',
                            cursor: 'pointer',
                            border: '2px solid rgba(255, 255, 255, 0.8)',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 15px rgba(0, 170, 255, 0.5)'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 170, 255, 0.8)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 170, 255, 0.4)'}
                        >
                            <label style={{ cursor: 'pointer', color: 'white', fontSize: '40px', fontFamily: 'sans-serif', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
                                <span>✎</span> Edit
                                <input type="file" accept="image/*,video/*" onChange={handleFileChange} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </Html>
                )}
            </motion.group>
        </group>
    )
}
