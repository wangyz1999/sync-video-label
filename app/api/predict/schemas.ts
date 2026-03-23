// JSON Schemas for structured LLM output

// JSON Schema for structured output - Action labels (SA, OA)
// caption: the action verb phrase, intent: the goal/purpose, intentDistractors: alternative intents
export const ACTION_PREDICTION_SCHEMA = {
  type: 'object',
  properties: {
    labels: {
      type: 'array',
      description: 'Array of action labels (SA for self-actions, OA for other-actions)',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['SA', 'OA'],
            description: 'SA for self-action (POV player), OA for other-action (other players)',
          },
          other: {
            type: 'string',
            description:
              'For OA only: describes who is performing the action (e.g., "teammate", "enemy", "NPC", "boss")',
          },
          startTime: {
            type: 'integer',
            minimum: 0,
            description: 'Start time in seconds',
          },
          endTime: {
            type: 'integer',
            minimum: 0,
            description: 'End time in seconds',
          },
          caption: {
            type: 'string',
            description: 'The action verb phrase (e.g., "shooting", "climbing up the ladder")',
          },
          intent: {
            type: 'string',
            description: 'The primary goal or purpose of the action (e.g., "kill the enemy")',
          },
          intentDistractors: {
            type: 'array',
            description: 'Alternative plausible intents for this action (3 alternatives)',
            items: { type: 'string' },
            minItems: 3,
            maxItems: 3,
          },
        },
        required: ['type', 'startTime', 'endTime', 'caption', 'intent', 'intentDistractors'],
        additionalProperties: false,
      },
    },
  },
  required: ['labels'],
  additionalProperties: false,
} as const;

// JSON Schema for structured output - State labels (SS, OS)
// caption: the variable/property name, value: the current state
export const STATE_PREDICTION_SCHEMA = {
  type: 'object',
  properties: {
    labels: {
      type: 'array',
      description: 'Array of state labels (SS for self-state, OS for other-state)',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['SS', 'OS'],
            description: 'SS for self-state (POV player), OS for other-state (other players)',
          },
          other: {
            type: 'string',
            description:
              'For OS only: describes whose state this is (e.g., "teammate", "enemy", "NPC", "boss")',
          },
          startTime: {
            type: 'integer',
            minimum: 0,
            description: 'Start time in seconds',
          },
          endTime: {
            type: 'integer',
            minimum: 0,
            description: 'End time in seconds',
          },
          caption: {
            type: 'string',
            description: 'The variable or property name (e.g., "health", "ammo", "active weapon")',
          },
          value: {
            type: 'string',
            description: 'The current value of the property (e.g., "full", "10 bullets")',
          },
        },
        required: ['type', 'startTime', 'endTime', 'caption'],
        additionalProperties: false,
      },
    },
  },
  required: ['labels'],
  additionalProperties: false,
} as const;

// JSON Schema for structured output - World labels (WO, WE)
export const WORLD_PREDICTION_SCHEMA = {
  type: 'object',
  properties: {
    labels: {
      type: 'array',
      description: 'Array of world-related labeled events identified in the video',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['WO', 'WE'],
            description: 'World label type code',
          },
          startTime: {
            type: 'integer',
            minimum: 0,
            description: 'Start time in seconds',
          },
          endTime: {
            type: 'integer',
            minimum: 0,
            description: 'End time in seconds',
          },
          caption: {
            type: 'string',
            description: 'Concise description of the event',
          },
        },
        required: ['type', 'startTime', 'endTime', 'caption'],
        additionalProperties: false,
      },
    },
  },
  required: ['labels'],
  additionalProperties: false,
} as const;

// JSON Schema for structured output - Scene Distractors (same 6 types as frame labels)
export const SCENE_DISTRACTOR_SCHEMA = {
  type: 'object',
  properties: {
    SA: {
      type: 'array',
      description: 'Plausible Self-Action distractors that did not occur',
      items: { type: 'string' },
    },
    SS: {
      type: 'array',
      description: 'Plausible Self-State distractors that did not occur',
      items: { type: 'string' },
    },
    OA: {
      type: 'array',
      description: 'Plausible Other-Action distractors that did not occur',
      items: { type: 'string' },
    },
    OS: {
      type: 'array',
      description: 'Plausible Other-State distractors that did not occur',
      items: { type: 'string' },
    },
    WO: {
      type: 'array',
      description: 'Plausible World-Object distractors that did not appear',
      items: { type: 'string' },
    },
    WE: {
      type: 'array',
      description: 'Plausible World-Event distractors that did not occur',
      items: { type: 'string' },
    },
  },
  required: ['SA', 'SS', 'OA', 'OS', 'WO', 'WE'],
  additionalProperties: false,
} as const;

// Schema for lexical distractor output per label type
const LEXICAL_DISTRACTOR_ITEMS_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        description: 'The ID matching the input caption',
      },
      distractors: {
        type: 'array',
        description: '1-2 lexical distractors for this caption',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 2,
      },
    },
    required: ['id', 'distractors'],
    additionalProperties: false,
  },
};

// JSON Schema for structured output - Lexical Distractors
export const LEXICAL_DISTRACTOR_SCHEMA = {
  type: 'object',
  properties: {
    SA: {
      ...LEXICAL_DISTRACTOR_ITEMS_SCHEMA,
      description: 'Lexical distractors for Self-Action captions',
    },
    SS: {
      ...LEXICAL_DISTRACTOR_ITEMS_SCHEMA,
      description: 'Lexical distractors for Self-State captions',
    },
    OA: {
      ...LEXICAL_DISTRACTOR_ITEMS_SCHEMA,
      description: 'Lexical distractors for Other-Action captions',
    },
    OS: {
      ...LEXICAL_DISTRACTOR_ITEMS_SCHEMA,
      description: 'Lexical distractors for Other-State captions',
    },
    WO: {
      ...LEXICAL_DISTRACTOR_ITEMS_SCHEMA,
      description: 'Lexical distractors for World-Object captions',
    },
    WE: {
      ...LEXICAL_DISTRACTOR_ITEMS_SCHEMA,
      description: 'Lexical distractors for World-Event captions',
    },
  },
  required: ['SA', 'SS', 'OA', 'OS', 'WO', 'WE'],
  additionalProperties: false,
} as const;
