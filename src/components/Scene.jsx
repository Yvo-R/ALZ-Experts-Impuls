import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import StarField from './StarField'
import LogoField from './LogoField'
import Presentation from './Presentation'

export default function Scene({ frames, logos, logoDistance, index, setIndex }) {
    return (
        <Canvas camera={{ position: [0, 0, 10], fov: 50, near: 0.1, far: 1000 }}>
            <color attach="background" args={['#000']} />
            <Suspense fallback={null}>
                <StarField />
                <LogoField logos={logos} distance={logoDistance} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Presentation frames={frames} index={index} setIndex={setIndex} />
            </Suspense>
        </Canvas>
    )
}
