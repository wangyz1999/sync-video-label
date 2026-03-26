# GameplayQA Multi-Video Timeline Captioner

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-sync--video--label.vercel.app-brightgreen?logo=vercel)](https://sync-video-label.vercel.app)
[![Project Page](https://img.shields.io/badge/Project%20Page-GameplayQA-blue?logo=github)](https://hats-ict.github.io/gameplayqa/)
[![Paper](https://img.shields.io/badge/Paper-arXiv-FF0066?logo=arxiv)](https://arxiv.org/abs/2603.24329)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-YouTube-red?logo=youtube)](https://www.youtube.com/watch?v=PKedELJ4XT0)

This tool supports the paper:  
**[GameplayQA: A Benchmarking Framework for Decision-Dense POV-Synced Multi-Video Understanding of 3D Virtual Agents](https://arxiv.org/abs/2603.24329)** For more details, visit the [project website](https://hats-ict.github.io/gameplayqa/).

<div align="center">
  <img src="public/interface_multi.jpg" alt="Multi-video interface" width="48%" />
  <img src="public/interface_single.jpg" alt="Single-video interface" width="48%" />
</div>

<div align="left">
  </br>
  <a href="https://www.youtube.com/watch?v=PKedELJ4XT0">
    <img src="https://img.shields.io/badge/Watch%20Demo%20Video%20on%20YouTube-%23FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch Demo Video on YouTube" />
  </a>
</div>

## Live Demo

A live demo is hosted here: **[https://sync-video-label.vercel.app](https://sync-video-label.vercel.app)**

Click the **"Load Example Project"** button on the landing page to explore the app with a pre-loaded dataset.

> Note: The demo is read-only. Saving annotations and exporting files requires running the app locally. Video files are purposely made low quality to reduce file size.

## Quick Start

### 1. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Try the example project

The example project is included in this repo. Check out `data/project-example/videos/` for sample videos and `data/project-example/project_example.json` as a reference for the project file format.

You can also directly see it in the Live Demo link above.

### 3. Import your own data

1. Prepare your video files and a `project.json` following the formats described in [Data Folder Structure](#data-folder-structure) and [Project File Format](#project-file-format). Only the project folder, video files, and the JSON file are required — all other folders are created automatically.
2. Rename `.env.local.example` to `.env.local` and fill in your API keys for [OpenRouter](https://openrouter.ai/) or [Google AI Studio](https://aistudio.google.com/):

```env
OPENROUTER_API_KEY=
GOOGLE_API_KEY=
```

3. Import your `project.json` in the app. You should be able to see the videos. Click the **"Generate"** button to test AI functionalities.

## Data Folder Structure

Organize your data into project folders:

```
data/
├── project-a/                    # Project folder
│   ├── videos/                   # Video files
│   │   ├── video1.mp4
│   │   └── video2.mp4
│   ├── annotation/               # Saved annotations (output)
│   │   └── instance-001.json
│   ├── autosave/                 # Auto-saved annotation progress
│   │   └── instance-001.json
│   ├── prediction/               # Pre-generated labels (optional)
│   │   └── instance-001.json
│   ├── questions/                # Exported questions from question editor
│   │   └── instance-001-2025-01-01T00-00-00.json
│   ├── autosave_question/        # Auto-saved question editor progress
│   │   └── instance-001.json
│   └── project.json              # Project configuration file
├── project-b/                    # Another project
│   └── ...
```

## Project File Format

Create a JSON file to define your labeling project:

```json
{
  "name": "My Project",
  "instances": [
    {
      "id": "instance-001",
      "name": "Scene 1",
      "videos": ["data/project-a/videos/video1.mp4", "data/project-a/videos/video2.mp4"],
      "prediction": "instance-001.json"
    }
  ]
}
```

| Field        | Description                                                            |
| ------------ | ---------------------------------------------------------------------- |
| `id`         | Unique identifier for the instance                                     |
| `name`       | Display name                                                           |
| `videos`     | Array of video paths (relative to project root)                        |
| `prediction` | Optional prediction file to auto-load (relative to `data/prediction/`) |

## Usage

1. Create a project folder in `data/` (e.g., `data/my-project/`)
2. Place your videos in `videos/` subfolder
3. Create a `project.json` file defining your instances
4. Click the empty area to import your project file
5. Drag on the timeline to create labels
6. Double-click labels to add captions
7. Click "Save Annotation" to export
