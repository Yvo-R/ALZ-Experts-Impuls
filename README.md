# 3D Presentation App

A dynamic, immersive 3D presentation application built with React and Three.js. This application allows users to create, edit, and present slides in a 3D space, featuring a persistent sidebar for management and IndexedDB for data persistence.

## Features

-   **Immersive 3D Environment**: Slides are arranged in a 3D space with smooth camera transitions using `maath`.
-   **Persistent Sidebar**: A collapsible, always-accessible sidebar for managing slides.
-   **Slide Management**:
    -   **Add/Insert**: Add new slides to the end or insert them between existing slides.
    -   **Reorder**: Drag and drop slides in the sidebar to reorder them.
    -   **Delete**: Quickly remove slides (with protection for the first slide).
    -   **Edit**: Update slide titles, upload images/videos, or embed YouTube links.
-   **Data Persistence**: All changes (slides, content, order) are saved locally using **IndexedDB**, ensuring your presentation is preserved across reloads.
-   **Keyboard Navigation**: Navigate using Arrow keys, Spacebar, or Home key.

## Tech Stack

-   **Core**: [React](https://reactjs.org/) (v18)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **3D Graphics**:
    -   [Three.js](https://threejs.org/): The 3D library.
    -   [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber): React renderer for Three.js.
    -   [@react-three/drei](https://github.com/pmndrs/drei): Useful helpers for R3F (Html, Text, etc.).
-   **Animation & UI**:
    -   [Framer Motion](https://www.framer.com/motion/): Used for the sidebar UI and drag-and-drop reordering.
    -   [maath](https://github.com/pmndrs/maath): Used for smooth 3D camera damping and transitions.
-   **State & Persistence**:
    -   **IndexedDB**: Native browser database for storing large binary data (images/videos) and application state.
    -   **UUID**: For generating unique frame IDs.

## Architecture

The application follows a lifted-state architecture to ensure UI persistence independent of the 3D scene.

### Components

1.  **`App.jsx`**: The root component that holds the global state (`frames`, `index`). It manages all logic for adding, updating, deleting, and reordering frames, as well as loading/saving to IndexedDB. It renders the `Sidebar` (UI layer) and `Scene` (3D layer).
2.  **`components/Sidebar.jsx`**: The 2D UI overlay. It displays the list of slides, handles drag-and-drop (via `framer-motion`), and provides controls for editing content. It is rendered outside the Canvas to remain persistent.
3.  **`components/Scene.jsx`**: The 3D Canvas setup. It configures lights, the starfield background, and renders the `Presentation` component.
4.  **`components/Presentation.jsx`**: A controlled 3D component. It receives the list of frames and the current index from `App.jsx`. It handles the camera movement logic (`useFrame`) to smoothly transition between slides.
5.  **`components/Frame.jsx`**: Renders an individual slide in 3D space, including its border, title, and content (Image, Video, or YouTube embed).
6.  **`utils/db.js`**: A utility module for interacting with IndexedDB, handling the storage and retrieval of frame data and blobs.

## Setup & Running

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```
