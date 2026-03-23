// Label type definitions - Actions (SA, OA)
export const ACTION_LABEL_TYPES_DESCRIPTION = `
## Label Types - Actions

**Self:** The POV player. **Other:** Any other player (teammates or enemies).

| Code | Full Name     | Description |
|------|---------------|-------------|
| SA   | Self-Action   | Actions performed by the POV player |
| OA   | Other-Action  | Actions performed by other players (teammates or enemies) |

Focus ONLY on player actions. Ignore states, world objects, and environmental events.
`;

// Label type definitions - States (SS, OS)
export const STATE_LABEL_TYPES_DESCRIPTION = `
## Label Types - States

**Self:** The POV player. **Other:** Any other player (teammates or enemies).

| Code | Full Name     | Description |
|------|---------------|-------------|
| SS   | Self-State    | States of the POV player (HP, ammo, cooldowns, location, etc.) |
| OS   | Other-State   | States of other players |

Focus ONLY on player states. Ignore actions, world objects, and environmental events.
`;

// Label type definitions - World-related (WO, WE)
export const WORLD_LABEL_TYPES_DESCRIPTION = `
## Label Types - World Focus

**World:** The game environment or objects/events not tied to a specific player.

You must categorize each event using exactly one of these 2 label types:

| Code | Full Name     | Description |
|------|---------------|-------------|
| WO   | World-Object  | Environment objects or landmarks (buildings, trees, vehicles, items on ground, etc.). |
| WE   | World-Event   | Environmental changes or system-level events (explosions, zone shrinking, weather changes, objective markers, game notifications, etc.). |

**Important Notes:**
- Focus ONLY on world objects and environmental events. Ignore player actions and states for this pass.
`;

// Build the system prompt for action labels (SA, OA)
export const ACTION_SYSTEM_PROMPT = `You are an expert video analyst for dense video captioning of video games.

${ACTION_LABEL_TYPES_DESCRIPTION}

## Requirements
1. Identify as many player actions as possible (dense captioning)
2. Be precise with timestamps. Actions can overlap - treat SA and OA as separate channels
3. Distinguish between Self (POV player) and Other carefully
4. For OA (Other-Action), ALWAYS specify who the "other" is (e.g., "teammate", "enemy", "NPC", "boss", "civilian")
5. For EVERY action, provide 3 alternative plausible intents (intentDistractors) - these are other reasonable purposes the action could have served

## Output Fields

Each label has: type, other (for OA), startTime, endTime, caption, intent, and intentDistractors.

- type: "SA" or "OA"
- other: (OA only) who is performing the action (e.g., "teammate", "enemy", "NPC", "boss")
- caption: the action verb phrase (e.g., "shooting", "climbing up the ladder")
- intent: the primary goal/purpose of the action
- intentDistractors: array of 3 alternative plausible intents for this action

## Intent Distractors
Actions can be multi-purpose. For each action, think of 3 reasonable intents that is meaningfully different from the primary intent.
- "placing a torch" could be to: "light up environment" OR "mark the path back" OR "signal teammates" OR "scare away enemies"
- "shooting" could be to: "kill the enemy" OR "create a distraction"
- all intent distractors must be meaningfully different from the primary intent to avoid ambiguity. For example, "acquire resources" and "acquire ammo" are ambiguous.


## Examples
- SA: caption="placing a torch", intent="light up environment", intentDistractors=["mark the path back", "signal teammates", "scare away enemies"]
- SA: caption="shooting", intent="kill the enemy", intentDistractors=["suppress enemy movement", "destroy cover", "create a distraction"]
- OA: other="enemy", caption="throwing a grenade", intent="flush out the player", intentDistractors=["deal damage", "block escape route", "create smoke cover"]
- OA: other="teammate", caption="reviving teammate", intent="restore team strength", intentDistractors=["buy time", "complete mission objective", "prevent respawn penalty"]
`;

// Build the system prompt for state labels (SS, OS)
export const STATE_SYSTEM_PROMPT = `You are an expert video analyst for dense video captioning of video games.

${STATE_LABEL_TYPES_DESCRIPTION}

## Requirements
1. Identify as many player states as possible (dense captioning)
2. Be precise with timestamps. States can overlap - treat SS and OS as separate channels
3. Distinguish between Self (POV player) and Other carefully
4. For OS (Other-State), ALWAYS specify who the "other" is (e.g., "teammate", "enemy", "NPC", etc.)
5. A trick to label good state is to pay attention to when state changes, and label the states before and after with timerranges.
6. Don't label action.

## Output Fields

Each label has: type, other (for OS), startTime, endTime, caption, and value.

- type: "SS" or "OS"
- other: (OS only) whose state this is (e.g., "teammate", "enemy", "NPC", "boss")
- caption: the variable/property name (e.g., "health", "ammo", "active weapon")
- value: the current state value (e.g., "full", "10 bullets left", "pistol")

## Examples
- SS: caption="health/armor", value="full/low/damaged"
- SS: caption="ammo count", value="10 bullets left"
- SS: caption="active weapon", value="pistol"
- SS: caption="position/location", value="behind cover/above the roof"
- OS: other="enemy", caption="health", value="critically low"
- OS: other="teammate", caption="status", value="downed"
- OS: other="enemy", caption="position", value="behind cover"
`;

// Build the system prompt for world-related labels
export const WORLD_SYSTEM_PROMPT = `You are an expert video analyst specializing in dense video captioning for multi-player video games. Your task is to analyze video footage and generate detailed, timestamped annotations focusing on WORLD-RELATED events.

${WORLD_LABEL_TYPES_DESCRIPTION}

## Requirements:
1. **Dense Captioning**: Identify as many world-related events as possible.
2. **Accurate Timestamps**: Be precise with start and end times. Events can commonly overlap if they occur simultaneously. Treat each label type WO, WE as individual signal channels. Ideally producing 2 concurrent channels of overlapping captions.
3. **Appropriate Label Types**: Carefully distinguish between World-Object and World-Event.
4. Follow the output format:

## Output Format
For each distinct event or observation, provide:
1. A label type (WO or WE)
2. A start time in seconds (integer)
3. An end time in seconds (integer)
4. Output WO object without quantifier.
5. A concise caption that follows a linguistic structure, defined below.

## Linguistic Structure
WorldObject: State the object name. It need to fits the template: "When [WorldObject] appears, ..."
WorldEvent: State the event name. It need to fits the template: "When [WorldEvent], ..."

The caption excludes the "When ..." part and directly state the object or event.

Examples:
WorldObject: "apple tree", "small building", "some cars", "helicopter on the runway", "ladder".
WorldEvent: "explosion happen", "the safe zone shrinks", "the weather changed", "the 'last squad remaining' message appears".
`;

// Scene Distractor prompt - suggests plausible but non-occurring events
// Uses the same 6 label types as frame labels (SA, SS, OA, OS, WO, WE)
export const SCENE_DISTRACTOR_SYSTEM_PROMPT = `You are an expert video analyst specializing in generating plausible scene distractors for video game footage. Your task is to analyze video footage and generate items that:
- Make sense in the context of the scene shown
- Are plausible given the game environment and setting
- Did NOT actually happen or appear in the video

A scene distractor is something that COULD have happened or appeared in the scene, but DIDN'T.

For example: If a video shows a kitchen scene where someone is cleaning dishes, "cooking dinner" is a good distractor because it makes sense in a kitchen but wasn't shown.

## Distractor Types

You must generate distractors for each of these 6 categories (same as frame labels):

| Code | Full Name     | Description |
|------|---------------|-------------|
| SA   | Self-Action   | Plausible actions the POV player could have performed but didn't. |
| SS   | Self-State    | Plausible states the POV player could have been in but wasn't. |
| OA   | Other-Action  | Plausible actions other players could have performed but didn't. |
| OS   | Other-State   | Plausible states other players could have been in but weren't. |
| WO   | World-Object  | Plausible world objects that could appear in the scene but didn't. |
| WE   | World-Event   | Plausible world events that could occur in the scene but didn't. |

## Requirements:
1. Generate 2-4 distractors for each category.
2. Make them believable - they should fit naturally with what IS shown in the video.
3. Ensure they are NOT things that actually happened or appeared in the video.
4. Follow the linguistic structure below for each type.

## Output Format
Provide a JSON object with six arrays: SA, SS, OA, OS, WO, WE.
Each array should contain 2-4 string items following the linguistic structure.

## Linguistic Structure
SelfAction (SA) and OtherAction (OA): Start with action verbs. Must fit: "When the player is [caption], ..."
SelfState (SS) and OtherState (OS): [<Property> <Value>]. Must fit: "When the player's [caption], ..."
WorldObject (WO): Object noun phrase. Must fit: "When [caption] appears, ..."
WorldEvent (WE): Event description. Must fit: "When [caption], ..."

The caption excludes the "When ..." part and directly state the action, state, object or event.

Examples:
SA: "reloading the weapon", "using a health pack", "switching to melee"
SS: "health is critically low", "ammo is depleted", "shield is fully charged"
OA: "reviving a teammate", "calling for backup", "flanking the enemy"
OS: "teammate is downed", "enemy health is low", "ally has ultimate ready"
WO: "a supply crate", "enemy reinforcements", "a parked vehicle"
WE: "an airstrike is called in", "the storm circle moves", "a teammate goes down"
`;

// Helper to build user prompt for single video analysis
export function buildUserPrompt(
  instanceName: string,
  videoPath: string,
  videoIndex: number,
  totalVideos: number,
  videoDuration: number
): string {
  const videoInfo =
    totalVideos > 1
      ? `This is video ${videoIndex + 1} of ${totalVideos} for instance "${instanceName}".`
      : `Analyzing video for instance "${instanceName}".`;

  return `${videoInfo}

Video file: ${videoPath}
Video duration: approximately ${Math.round(videoDuration)} seconds.

Please provide dense captioning (as many as possible) - identify and label ALL significant events, actions, states, objects, and environmental changes visible in this video.`;
}

// Helper to build user prompt for scene distractor generation
export function buildSceneDistractorUserPrompt(
  instanceName: string,
  videoPath: string,
  videoIndex: number,
  totalVideos: number,
  videoDuration: number
): string {
  const videoInfo =
    totalVideos > 1
      ? `This is video ${videoIndex + 1} of ${totalVideos} for instance "${instanceName}".`
      : `Analyzing video for instance "${instanceName}".`;

  return `${videoInfo}

Video file: ${videoPath}
Video duration: approximately ${Math.round(videoDuration)} seconds.

Please analyze this video and generate plausible scene distractors - things that COULD have happened or appeared given the scene context, but did NOT actually occur in the video.

Generate 2-4 items for each category: SA, SS, OA, OS, WO, WE.`;
}

// Lexical Distractor System Prompt - text-based, no video required
export const LEXICAL_DISTRACTOR_SYSTEM_PROMPT = `You are an expert at generating lexical distractors for video game captions.

A lexical distractor is created by changing the lexical meaning of a caption to make it describe a DIFFERENT action/state/object/event. This is done purely through text manipulation - no video context needed.

## Techniques for Creating Lexical Distractors:

1. **Antonyms**: Replace key verbs/adjectives with their opposites
   - "knocking down the enemy" → "reviving the enemy"
   - "ammo count is decreasing" → "ammo count is being restored"
   - "climbing up wall" → "climbing down wall"

2. **Attribute Changes**: Modify descriptive attributes
   - "a yellow car" → "a blue car"
   - "a large building" → "a small building"
   - "health is full" → "health is critically low"

3. **Subject/Object Swaps**: Change who/what is involved
   - "knocking down the enemy" → "knocking down the teammate"
   - "shooting at enemies" → "shooting at NPCs"

## Label Type Guidelines:

- **SA (Self-Action)**: Actions by POV player - use antonym verbs or change targets
- **SS (Self-State)**: POV player states in format "[property] is [value]" - change the value to opposite/different state
  - "health is full" → "health is critically low"
  - "ammo is depleted" → "ammo is full"
- **OA (Other-Action)**: Actions by other players - similar to SA
- **OS (Other-State)**: Other player states in format "[property] is [value]" - similar to SS
  - "enemy health is low" → "enemy health is full"
  - "teammate is downed" → "teammate is revived"
- **WO (World-Object)**: Environment objects - change attributes (color, size, type)
- **WE (World-Event)**: Environmental events - use opposite events or change details

## Requirements:
1. Generate 1-2 lexical distractors for each caption
2. Keep the same linguistic structure as the original caption
3. Make distractors plausible within the game context
4. Ensure distractors are meaningfully different from the original
5. Match each output to the input ID exactly`;

// Helper to build lexical distractor input JSON
export function buildLexicalDistractorInput(
  labels: Array<{ type: string; caption: string; value?: string }>
): Record<string, Array<{ id: number; caption: string }>> {
  const grouped: Record<string, Array<{ id: number; caption: string }>> = {
    SA: [],
    SS: [],
    OA: [],
    OS: [],
    WO: [],
    WE: [],
  };

  // Group labels by type with sequential IDs within each type
  const typeCounters: Record<string, number> = { SA: 0, SS: 0, OA: 0, OS: 0, WO: 0, WE: 0 };

  for (const label of labels) {
    if (label.type in grouped && label.caption && label.caption.trim()) {
      // For SS and OS, use full state text: "caption is value"
      let captionText = label.caption;
      if ((label.type === 'SS' || label.type === 'OS') && label.value && label.value.trim()) {
        captionText = `${label.caption} is ${label.value}`;
      }

      grouped[label.type].push({
        id: typeCounters[label.type]++,
        caption: captionText,
      });
    }
  }

  return grouped;
}

// Helper to build user prompt for lexical distractor generation
export function buildLexicalDistractorUserPrompt(captionsJson: string): string {
  return `Generate lexical distractors for the following captions. Each caption has an ID - your output must match these IDs exactly.

Input captions by label type:
${captionsJson}

For each caption, generate 1-2 lexical distractors that change the meaning through antonyms, attribute changes, or subject/object swaps. Output must include the matching ID for each entry.`;
}
