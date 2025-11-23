
import React, { useState } from 'react'

export default function Sidebar({ frames, onUpdate, onUpdateTitle, onAdd, onDelete, onInsert, onSelect, activeIndex }) {
    const [isOpen, setIsOpen] = useState(false)

    // Only show sidebar on the first slide (index 0)
    if (activeIndex !== 0) return null

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100vh',
            zIndex: 1000,
            display: 'flex',
            pointerEvents: 'none' // Container passes clicks through
        }}>
            {/* Sidebar Panel */}
            <div style={{
                width: isOpen ? '300px' : '0px',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'width 0.3s ease',
                overflow: 'hidden',
                pointerEvents: 'auto', // Sidebar captures clicks
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>Presentation</h2>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                    {frames.map((frame, index) => (
                        <div key={frame.id} style={{
                            marginBottom: '15px',
                            padding: '10px',
                            background: activeIndex === index ? 'rgba(0, 170, 255, 0.1)' : 'rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            border: activeIndex === index ? '1px solid #00aaff' : '1px solid transparent',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                <div
                                    onClick={() => onSelect(index)}
                                    style={{
                                        color: '#00aaff',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Slide {index + 1}
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onInsert(index)
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#00ff88',
                                            cursor: 'pointer',
                                            fontSize: '1.2rem',
                                            padding: '0 5px',
                                            lineHeight: 1
                                        }}
                                        title="Insert Slide After"
                                    >
                                        +
                                    </button>
                                    {index !== 0 && ( // Prevent deleting the first slide
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                onDelete(frame.id)
                                            }}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#ff4444',
                                                cursor: 'pointer',
                                                fontSize: '1.2rem',
                                                padding: '0 5px',
                                                lineHeight: 1
                                            }}
                                            title="Delete Slide"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Title Input */}
                            <input
                                type="text"
                                value={frame.title}
                                onChange={(e) => onUpdateTitle(frame.id, e.target.value)}
                                placeholder="Slide Title"
                                style={{
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'white',
                                    padding: '5px',
                                    borderRadius: '4px',
                                    marginBottom: '10px',
                                    fontSize: '0.9rem'
                                }}
                            />

                            {/* Thumbnail & Filename */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '10px',
                                background: 'rgba(0,0,0,0.2)',
                                padding: '5px',
                                borderRadius: '4px'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    background: '#000',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {frame.type === 'image' ? (
                                        <img src={frame.url} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : frame.type === 'video' ? (
                                        <span style={{ fontSize: '1.2rem' }}>🎥</span>
                                    ) : (
                                        <span style={{ fontSize: '1.2rem' }}>▶️</span>
                                    )}
                                </div>
                                <div style={{
                                    color: 'rgba(255,255,255,0.7)',
                                    fontSize: '0.75rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {frame.filename || (frame.type === 'youtube' ? 'YouTube Video' : 'Default Image')}
                                </div>
                            </div>

                            {/* Content Controls */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{
                                    background: '#333',
                                    color: 'white',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    Change Content
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files[0]
                                            if (file) {
                                                const type = file.type.startsWith('video') ? 'video' : 'image'
                                                onUpdate(frame.id, file, type)
                                            }
                                        }}
                                    />
                                </label>

                                <input
                                    type="text"
                                    placeholder="Paste YouTube URL"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            onUpdate(frame.id, e.target.value, 'youtube')
                                            e.target.value = '' // Clear input
                                        }
                                    }}
                                    style={{
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: 'white',
                                        padding: '5px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem'
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={onAdd}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#00aaff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        + Add Slide
                    </button>
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'absolute',
                    left: isOpen ? '300px' : '0px',
                    top: '20px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 15px',
                    borderRadius: '0 8px 8px 0',
                    cursor: 'pointer',
                    transition: 'left 0.3s ease',
                    pointerEvents: 'auto',
                    backdropFilter: 'blur(5px)'
                }}
            >
                {isOpen ? '◀' : '▶'}
            </button>
        </div>
    )
}
