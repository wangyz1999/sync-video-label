# Multi-Video Timeline Captioner

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

A local web tool for annotating and captioning multiple synchronized videos on a shared timeline.

## Quick Start

1. Install
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

2. Download data
Download [project-example](https://drive.google.com/drive/u/0/folders/1ce3YJj6-Iqof0bKTz1mHjzZebFSxGrqf), and place it under `data/project-example`
3. Create a `.env.local` file in the project root, enter api keys
4. Import `project_example.json`, and you should be able to see the videos. Click the "Generate" button to test AI functionalities.

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
