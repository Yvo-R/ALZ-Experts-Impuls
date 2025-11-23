import React, { useRef, useState, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Image, useCursor, Html, useVideoTexture } from '@react-three/drei'
import { motion } from 'framer-motion-3d'

function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
}

function VideoPlane({ url }) {
    const texture = useVideoTexture(url)
    return (
        <mesh scale={[4, 2.25, 1]}>
            <planeGeometry />
            <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
    )
}

export default function Frame({ id, position, rotation, url, type = 'image', title, isActive, onClick, ...props }) {
    const ref = useRef()
    const [hovered, setHover] = useState(false)
    useCursor(hovered)

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
                    ) : type === 'youtube' ? (
                        <Html transform position={[0, 0, 0.02]} scale={0.1} occlude="blending" zIndexRange={[100, 0]}>
                            <div style={{ width: '1600px', height: '900px', background: 'black' }}>
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${getYouTubeId(url)}?autoplay=1&mute=1&enablejsapi=1`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </Html>
                    ) : (
                        <Image url={url} scale={[4, 2.25]} transparent opacity={0.9} position={[0, 0, 0.01]} />
                    )}
                </Suspense>

                {/* Title */}
                <Text
                    position={[0, 1.4, 0.2]}
                    fontSize={0.25}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                >
                    {title}
                </Text>
            </motion.group>
        </group>
    )
}
