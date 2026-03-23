import { QuestionTemplate } from './types';

// Level 1 question templates (Perception)
export const LEVEL1_TEMPLATES: QuestionTemplate[] = [
  // IDENT - Identification questions
  {
    code: 'SA-IDENT',
    template: 'Which of the following actions did the POV player perform during the video?',
    answerType: 'SA',
  },
  {
    code: 'SS-IDENT',
    template: "Which of the following best describes the POV player's state in the video?",
    answerType: 'SS',
  },
  {
    code: 'OA-IDENT',
    template: 'Which of the following actions did {other} perform during the video?',
    answerType: 'OA',
  },
  {
    code: 'OS-IDENT',
    template: "Which of the following best describes {other}'s state in the video?",
    answerType: 'OS',
  },
  {
    code: 'WO-IDENT',
    template: 'Which of the following objects appeared in the video?',
    answerType: 'WO',
  },
  {
    code: 'WE-IDENT',
    template: 'Which of the following event occurred in the video?',
    answerType: 'WE',
  },

  // EXIST - Existence questions (True/False)
  {
    code: 'SA-EXIST',
    template: 'Did the POV player perform the action: "{caption}"?',
    answerType: 'SA',
  },
  {
    code: 'SS-EXIST',
    template: 'Can you describe the POV player\'s state as: "{caption}"?',
    answerType: 'SS',
  },
  {
    code: 'OA-EXIST',
    template: 'Did the {other} perform the action: "{caption}"?',
    answerType: 'OA',
  },
  {
    code: 'OS-EXIST',
    template: 'Can you describe the {other}\'s state as: "{caption}"?',
    answerType: 'OS',
  },
  {
    code: 'WO-EXIST',
    template: 'Did the object "{caption}" appear in the video?',
    answerType: 'WO',
  },
  { code: 'WE-EXIST', template: 'Did the event "{caption}" occur in the video?', answerType: 'WE' },

  // ABSENT - Negation questions
  { code: 'WO-ABSENT', template: 'Which objects is NOT present in the scene?', answerType: 'WO' },
  { code: 'SA-ABSENT', template: 'Which action did the POV player NOT perform?', answerType: 'SA' },
  {
    code: 'SS-ABSENT',
    template: "Which of the following states does not describe the POV player's state?",
    answerType: 'SS',
  },
  {
    code: 'OA-ABSENT',
    template: 'Which action did the {other} NOT perform?',
    answerType: 'OA',
  },
  {
    code: 'OS-ABSENT',
    template: "Which of the following does not describe the {other}'s state?",
    answerType: 'OS',
  },
  {
    code: 'WE-ABSENT',
    template: 'Which of the following events did NOT occur in the video?',
    answerType: 'WE',
  },

  // COUNT - Quantity questions
  {
    code: 'SA-COUNT',
    template: 'How many times did the POV player perform the action: "{caption}"?',
    answerType: 'SA',
  },
  {
    code: 'OA-COUNT',
    template: 'How many times did the {other} perform the action: "{caption}"?',
    answerType: 'OA',
  },
  { code: 'WO-COUNT', template: 'How many {caption} are there in the scene?', answerType: 'WO' },
  {
    code: 'WE-COUNT',
    template: 'How many times did the event "{caption}" occur in the video?',
    answerType: 'WE',
  },

  // INTENT - Why questions for actions
  {
    code: 'SA-INTENT',
    template: 'Why did the POV player perform the action: "{caption}"?',
    answerType: 'SA',
  },
  {
    code: 'OA-INTENT',
    template: 'Why did the {other} perform the action: "{caption}"?',
    answerType: 'OA',
  },

  // CAUSAL - Why questions based on causal relations
  {
    code: 'CAUSAL',
    template: 'Why did {effect}?',
    answerType: 'SA', // Answer type varies based on cause label
  },

  // TIME - When questions (timestamp as answer)
  {
    code: 'SA-TIME',
    template: 'When did the POV player perform the action: "{caption}"?',
    answerType: 'SA',
  },
  {
    code: 'SS-TIME',
    template: 'When was the POV player\'s "{caption}"?',
    answerType: 'SS',
  },
  {
    code: 'OA-TIME',
    template: 'When did {other} perform the action: "{caption}"?',
    answerType: 'OA',
  },
  {
    code: 'OS-TIME',
    template: 'When was {other}\'s "{caption}"?',
    answerType: 'OS',
  },
  {
    code: 'WO-TIME',
    template: 'When did the object "{caption}" appear?',
    answerType: 'WO',
  },
  {
    code: 'WE-TIME',
    template: 'When did the event "{caption}" occur?',
    answerType: 'WE',
  },
];

// Level 2 question templates (Temporal Relation)
// Complete bidirectional relationships for SA, SS, OA, OS, WO, WE
// Format: {Reference}2{Answer}-{Suffix}
export const LEVEL2_TEMPLATES: QuestionTemplate[] = [
  // ============================================
  // SA (Self Action) as Reference
  // ============================================
  // SA -> SS
  {
    code: 'SA2SS-IDENT',
    template:
      'When the POV player was performing the action: "{refCaption}", which of the following best describes their state?',
    answerType: 'SS',
    referenceType: 'SA',
  },
  {
    code: 'SA2SS-EXIST',
    template:
      'When the POV player was performing the action: "{refCaption}", can you describe their state as: "{caption}"?',
    answerType: 'SS',
    referenceType: 'SA',
  },
  {
    code: 'SA2SS-ABSENT',
    template:
      'When the POV player was performing the action: "{refCaption}", which of the following does NOT describe their state?',
    answerType: 'SS',
    referenceType: 'SA',
  },
  // SA -> OA
  {
    code: 'SA2OA-IDENT',
    template:
      'When the POV player was performing the action: "{refCaption}", which of the following actions did {other} perform?',
    answerType: 'OA',
    referenceType: 'SA',
  },
  {
    code: 'SA2OA-EXIST',
    template:
      'When the POV player was performing the action: "{refCaption}", did {other} perform the action: "{caption}"?',
    answerType: 'OA',
    referenceType: 'SA',
  },
  {
    code: 'SA2OA-ABSENT',
    template:
      'When the POV player was performing the action: "{refCaption}", which action did {other} NOT perform?',
    answerType: 'OA',
    referenceType: 'SA',
  },
  // SA -> OS
  {
    code: 'SA2OS-IDENT',
    template:
      'When the POV player was performing the action: "{refCaption}", which of the following best describes {other}\'s state?',
    answerType: 'OS',
    referenceType: 'SA',
  },
  {
    code: 'SA2OS-EXIST',
    template:
      'When the POV player was performing the action: "{refCaption}", can you describe {other}\'s state as: "{caption}"?',
    answerType: 'OS',
    referenceType: 'SA',
  },
  {
    code: 'SA2OS-ABSENT',
    template:
      'When the POV player was performing the action: "{refCaption}", which of the following does NOT describe {other}\'s state?',
    answerType: 'OS',
    referenceType: 'SA',
  },
  // SA -> WO
  {
    code: 'SA2WO-IDENT',
    template:
      'When the POV player was performing the action: "{refCaption}", which of the following objects appeared?',
    answerType: 'WO',
    referenceType: 'SA',
  },
  {
    code: 'SA2WO-EXIST',
    template:
      'When the POV player was performing the action: "{refCaption}", did the object "{caption}" appear?',
    answerType: 'WO',
    referenceType: 'SA',
  },
  {
    code: 'SA2WO-ABSENT',
    template:
      'When the POV player was performing the action: "{refCaption}", which object did NOT appear?',
    answerType: 'WO',
    referenceType: 'SA',
  },
  // SA -> WE
  {
    code: 'SA2WE-IDENT',
    template:
      'When the POV player was performing the action: "{refCaption}", which of the following events occurred?',
    answerType: 'WE',
    referenceType: 'SA',
  },
  {
    code: 'SA2WE-EXIST',
    template:
      'When the POV player was performing the action: "{refCaption}", did the event "{caption}" occur?',
    answerType: 'WE',
    referenceType: 'SA',
  },
  {
    code: 'SA2WE-ABSENT',
    template:
      'When the POV player was performing the action: "{refCaption}", which of the following events did NOT occur?',
    answerType: 'WE',
    referenceType: 'SA',
  },

  // ============================================
  // SS (Self State) as Reference
  // ============================================
  // SS -> SA
  {
    code: 'SS2SA-IDENT',
    template:
      'When the POV player\'s "{refCaption}", which of the following actions did they perform?',
    answerType: 'SA',
    referenceType: 'SS',
  },
  {
    code: 'SS2SA-EXIST',
    template: 'When the POV player\'s "{refCaption}", did they perform the action: "{caption}"?',
    answerType: 'SA',
    referenceType: 'SS',
  },
  {
    code: 'SS2SA-ABSENT',
    template: 'When the POV player\'s "{refCaption}", which action did they NOT perform?',
    answerType: 'SA',
    referenceType: 'SS',
  },
  // SS -> OA
  {
    code: 'SS2OA-IDENT',
    template:
      'When the POV player\'s "{refCaption}", which of the following actions did {other} perform?',
    answerType: 'OA',
    referenceType: 'SS',
  },
  {
    code: 'SS2OA-EXIST',
    template: 'When the POV player\'s "{refCaption}", did {other} perform the action: "{caption}"?',
    answerType: 'OA',
    referenceType: 'SS',
  },
  {
    code: 'SS2OA-ABSENT',
    template: 'When the POV player\'s "{refCaption}", which action did {other} NOT perform?',
    answerType: 'OA',
    referenceType: 'SS',
  },
  // SS -> OS
  {
    code: 'SS2OS-IDENT',
    template:
      'When the POV player\'s "{refCaption}", which of the following best describes {other}\'s state?',
    answerType: 'OS',
    referenceType: 'SS',
  },
  {
    code: 'SS2OS-EXIST',
    template:
      'When the POV player\'s "{refCaption}", can you describe {other}\'s state as: "{caption}"?',
    answerType: 'OS',
    referenceType: 'SS',
  },
  {
    code: 'SS2OS-ABSENT',
    template:
      'When the POV player\'s "{refCaption}", which of the following does NOT describe {other}\'s state?',
    answerType: 'OS',
    referenceType: 'SS',
  },
  // SS -> WO
  {
    code: 'SS2WO-IDENT',
    template: 'When the POV player\'s "{refCaption}", which of the following objects appeared?',
    answerType: 'WO',
    referenceType: 'SS',
  },
  {
    code: 'SS2WO-EXIST',
    template: 'When the POV player\'s "{refCaption}", did the object "{caption}" appear?',
    answerType: 'WO',
    referenceType: 'SS',
  },
  {
    code: 'SS2WO-ABSENT',
    template: 'When the POV player\'s "{refCaption}", which object did NOT appear?',
    answerType: 'WO',
    referenceType: 'SS',
  },
  // SS -> WE
  {
    code: 'SS2WE-IDENT',
    template: 'When the POV player\'s "{refCaption}", which of the following events occurred?',
    answerType: 'WE',
    referenceType: 'SS',
  },
  {
    code: 'SS2WE-EXIST',
    template: 'When the POV player\'s "{refCaption}", did the event "{caption}" occur?',
    answerType: 'WE',
    referenceType: 'SS',
  },
  {
    code: 'SS2WE-ABSENT',
    template: 'When the POV player\'s "{refCaption}", which of the following events did NOT occur?',
    answerType: 'WE',
    referenceType: 'SS',
  },

  // ============================================
  // OA (Other Action) as Reference
  // ============================================
  // OA -> SA
  {
    code: 'OA2SA-IDENT',
    template:
      'When {other} was performing the action: "{refCaption}", which of the following actions did the POV player perform?',
    answerType: 'SA',
    referenceType: 'OA',
  },
  {
    code: 'OA2SA-EXIST',
    template:
      'When {other} was performing the action: "{refCaption}", did the POV player perform the action: "{caption}"?',
    answerType: 'SA',
    referenceType: 'OA',
  },
  {
    code: 'OA2SA-ABSENT',
    template:
      'When {other} was performing the action: "{refCaption}", which action did the POV player NOT perform?',
    answerType: 'SA',
    referenceType: 'OA',
  },
  // OA -> SS
  {
    code: 'OA2SS-IDENT',
    template:
      'When {other} was performing the action: "{refCaption}", which of the following best describes the POV player\'s state?',
    answerType: 'SS',
    referenceType: 'OA',
  },
  {
    code: 'OA2SS-EXIST',
    template:
      'When {other} was performing the action: "{refCaption}", can you describe the POV player\'s state as: "{caption}"?',
    answerType: 'SS',
    referenceType: 'OA',
  },
  {
    code: 'OA2SS-ABSENT',
    template:
      'When {other} was performing the action: "{refCaption}", which of the following does NOT describe the POV player\'s state?',
    answerType: 'SS',
    referenceType: 'OA',
  },
  // OA -> OS
  {
    code: 'OA2OS-IDENT',
    template:
      'When {other} was performing the action: "{refCaption}", which of the following best describes their state?',
    answerType: 'OS',
    referenceType: 'OA',
  },
  {
    code: 'OA2OS-EXIST',
    template:
      'When {other} was performing the action: "{refCaption}", can you describe their state as: "{caption}"?',
    answerType: 'OS',
    referenceType: 'OA',
  },
  {
    code: 'OA2OS-ABSENT',
    template:
      'When {other} was performing the action: "{refCaption}", which of the following does NOT describe their state?',
    answerType: 'OS',
    referenceType: 'OA',
  },
  // OA -> WO
  {
    code: 'OA2WO-IDENT',
    template:
      'When {other} was performing the action: "{refCaption}", which of the following objects appeared?',
    answerType: 'WO',
    referenceType: 'OA',
  },
  {
    code: 'OA2WO-EXIST',
    template:
      'When {other} was performing the action: "{refCaption}", did the object "{caption}" appear?',
    answerType: 'WO',
    referenceType: 'OA',
  },
  {
    code: 'OA2WO-ABSENT',
    template:
      'When {other} was performing the action: "{refCaption}", which object did NOT appear?',
    answerType: 'WO',
    referenceType: 'OA',
  },
  // OA -> WE
  {
    code: 'OA2WE-IDENT',
    template:
      'When {other} was performing the action: "{refCaption}", which of the following events occurred?',
    answerType: 'WE',
    referenceType: 'OA',
  },
  {
    code: 'OA2WE-EXIST',
    template:
      'When {other} was performing the action: "{refCaption}", did the event "{caption}" occur?',
    answerType: 'WE',
    referenceType: 'OA',
  },
  {
    code: 'OA2WE-ABSENT',
    template:
      'When {other} was performing the action: "{refCaption}", which of the following events did NOT occur?',
    answerType: 'WE',
    referenceType: 'OA',
  },

  // ============================================
  // OS (Other State) as Reference
  // ============================================
  // OS -> SA
  {
    code: 'OS2SA-IDENT',
    template:
      'When {other}\'s "{refCaption}", which of the following actions did the POV player perform?',
    answerType: 'SA',
    referenceType: 'OS',
  },
  {
    code: 'OS2SA-EXIST',
    template: 'When {other}\'s "{refCaption}", did the POV player perform the action: "{caption}"?',
    answerType: 'SA',
    referenceType: 'OS',
  },
  {
    code: 'OS2SA-ABSENT',
    template: 'When {other}\'s "{refCaption}", which action did the POV player NOT perform?',
    answerType: 'SA',
    referenceType: 'OS',
  },
  // OS -> SS
  {
    code: 'OS2SS-IDENT',
    template:
      'When {other}\'s "{refCaption}", which of the following best describes the POV player\'s state?',
    answerType: 'SS',
    referenceType: 'OS',
  },
  {
    code: 'OS2SS-EXIST',
    template:
      'When {other}\'s "{refCaption}", can you describe the POV player\'s state as: "{caption}"?',
    answerType: 'SS',
    referenceType: 'OS',
  },
  {
    code: 'OS2SS-ABSENT',
    template:
      'When {other}\'s "{refCaption}", which of the following does NOT describe the POV player\'s state?',
    answerType: 'SS',
    referenceType: 'OS',
  },
  // OS -> OA
  {
    code: 'OS2OA-IDENT',
    template: 'When {other}\'s "{refCaption}", which of the following actions did they perform?',
    answerType: 'OA',
    referenceType: 'OS',
  },
  {
    code: 'OS2OA-EXIST',
    template: 'When {other}\'s "{refCaption}", did they perform the action: "{caption}"?',
    answerType: 'OA',
    referenceType: 'OS',
  },
  {
    code: 'OS2OA-ABSENT',
    template: 'When {other}\'s "{refCaption}", which action did they NOT perform?',
    answerType: 'OA',
    referenceType: 'OS',
  },
  // OS -> WO
  {
    code: 'OS2WO-IDENT',
    template: 'When {other}\'s "{refCaption}", which of the following objects appeared?',
    answerType: 'WO',
    referenceType: 'OS',
  },
  {
    code: 'OS2WO-EXIST',
    template: 'When {other}\'s "{refCaption}", did the object "{caption}" appear?',
    answerType: 'WO',
    referenceType: 'OS',
  },
  {
    code: 'OS2WO-ABSENT',
    template: 'When {other}\'s "{refCaption}", which object did NOT appear?',
    answerType: 'WO',
    referenceType: 'OS',
  },
  // OS -> WE
  {
    code: 'OS2WE-IDENT',
    template: 'When {other}\'s "{refCaption}", which of the following events occurred?',
    answerType: 'WE',
    referenceType: 'OS',
  },
  {
    code: 'OS2WE-EXIST',
    template: 'When {other}\'s "{refCaption}", did the event "{caption}" occur?',
    answerType: 'WE',
    referenceType: 'OS',
  },
  {
    code: 'OS2WE-ABSENT',
    template: 'When {other}\'s "{refCaption}", which of the following events did NOT occur?',
    answerType: 'WE',
    referenceType: 'OS',
  },

  // ============================================
  // WO (World Object) as Reference
  // ============================================
  // WO -> SA
  {
    code: 'WO2SA-IDENT',
    template:
      'At the moment when the object "{refCaption}" appeared, which of the following actions did the POV player perform?',
    answerType: 'SA',
    referenceType: 'WO',
  },
  {
    code: 'WO2SA-EXIST',
    template:
      'At the moment when the object "{refCaption}" appeared, did the POV player perform the action: "{caption}"?',
    answerType: 'SA',
    referenceType: 'WO',
  },
  {
    code: 'WO2SA-ABSENT',
    template:
      'At the moment when the object "{refCaption}" appeared, which action did the POV player NOT perform?',
    answerType: 'SA',
    referenceType: 'WO',
  },
  // WO -> SS
  {
    code: 'WO2SS-IDENT',
    template:
      'At the moment when the object "{refCaption}" appeared, which of the following best describes the POV player\'s state?',
    answerType: 'SS',
    referenceType: 'WO',
  },
  {
    code: 'WO2SS-EXIST',
    template:
      'At the moment when the object "{refCaption}" appeared, can you describe the POV player\'s state as: "{caption}"?',
    answerType: 'SS',
    referenceType: 'WO',
  },
  {
    code: 'WO2SS-ABSENT',
    template:
      'At the moment when the object "{refCaption}" appeared, which of the following does NOT describe the POV player\'s state?',
    answerType: 'SS',
    referenceType: 'WO',
  },
  // WO -> OA
  {
    code: 'WO2OA-IDENT',
    template:
      'At the moment when the object "{refCaption}" appeared, which of the following actions did {other} perform?',
    answerType: 'OA',
    referenceType: 'WO',
  },
  {
    code: 'WO2OA-EXIST',
    template:
      'At the moment when the object "{refCaption}" appeared, did {other} perform the action: "{caption}"?',
    answerType: 'OA',
    referenceType: 'WO',
  },
  {
    code: 'WO2OA-ABSENT',
    template:
      'At the moment when the object "{refCaption}" appeared, which action did {other} NOT perform?',
    answerType: 'OA',
    referenceType: 'WO',
  },
  // WO -> OS
  {
    code: 'WO2OS-IDENT',
    template:
      'At the moment when the object "{refCaption}" appeared, which of the following best describes {other}\'s state?',
    answerType: 'OS',
    referenceType: 'WO',
  },
  {
    code: 'WO2OS-EXIST',
    template:
      'At the moment when the object "{refCaption}" appeared, can you describe {other}\'s state as: "{caption}"?',
    answerType: 'OS',
    referenceType: 'WO',
  },
  {
    code: 'WO2OS-ABSENT',
    template:
      'At the moment when the object "{refCaption}" appeared, which of the following does NOT describe {other}\'s state?',
    answerType: 'OS',
    referenceType: 'WO',
  },
  // WO -> WE
  {
    code: 'WO2WE-IDENT',
    template:
      'At the moment when the object "{refCaption}" appeared, which of the following events occurred?',
    answerType: 'WE',
    referenceType: 'WO',
  },
  {
    code: 'WO2WE-EXIST',
    template:
      'At the moment when the object "{refCaption}" appeared, did the event "{caption}" occur?',
    answerType: 'WE',
    referenceType: 'WO',
  },
  {
    code: 'WO2WE-ABSENT',
    template:
      'At the moment when the object "{refCaption}" appeared, which of the following events did NOT occur?',
    answerType: 'WE',
    referenceType: 'WO',
  },

  // ============================================
  // WE (World Event) as Reference
  // ============================================
  // WE -> SA
  {
    code: 'WE2SA-IDENT',
    template:
      'At the moment when the event "{refCaption}" occurred, which of the following actions did the POV player perform?',
    answerType: 'SA',
    referenceType: 'WE',
  },
  {
    code: 'WE2SA-EXIST',
    template:
      'At the moment when the event "{refCaption}" occurred, did the POV player perform the action: "{caption}"?',
    answerType: 'SA',
    referenceType: 'WE',
  },
  {
    code: 'WE2SA-ABSENT',
    template:
      'At the moment when the event "{refCaption}" occurred, which action did the POV player NOT perform?',
    answerType: 'SA',
    referenceType: 'WE',
  },
  // WE -> SS
  {
    code: 'WE2SS-IDENT',
    template:
      'At the moment when the event "{refCaption}" occurred, which of the following best describes the POV player\'s state?',
    answerType: 'SS',
    referenceType: 'WE',
  },
  {
    code: 'WE2SS-EXIST',
    template:
      'At the moment when the event "{refCaption}" occurred, can you describe the POV player\'s state as: "{caption}"?',
    answerType: 'SS',
    referenceType: 'WE',
  },
  {
    code: 'WE2SS-ABSENT',
    template:
      'At the moment when the event "{refCaption}" occurred, which of the following does NOT describe the POV player\'s state?',
    answerType: 'SS',
    referenceType: 'WE',
  },
  // WE -> OA
  {
    code: 'WE2OA-IDENT',
    template:
      'At the moment when the event "{refCaption}" occurred, which of the following actions did {other} perform?',
    answerType: 'OA',
    referenceType: 'WE',
  },
  {
    code: 'WE2OA-EXIST',
    template:
      'At the moment when the event "{refCaption}" occurred, did {other} perform the action: "{caption}"?',
    answerType: 'OA',
    referenceType: 'WE',
  },
  {
    code: 'WE2OA-ABSENT',
    template:
      'At the moment when the event "{refCaption}" occurred, which action did {other} NOT perform?',
    answerType: 'OA',
    referenceType: 'WE',
  },
  // WE -> OS
  {
    code: 'WE2OS-IDENT',
    template:
      'At the moment when the event "{refCaption}" occurred, which of the following best describes {other}\'s state?',
    answerType: 'OS',
    referenceType: 'WE',
  },
  {
    code: 'WE2OS-EXIST',
    template:
      'At the moment when the event "{refCaption}" occurred, can you describe {other}\'s state as: "{caption}"?',
    answerType: 'OS',
    referenceType: 'WE',
  },
  {
    code: 'WE2OS-ABSENT',
    template:
      'At the moment when the event "{refCaption}" occurred, which of the following does NOT describe {other}\'s state?',
    answerType: 'OS',
    referenceType: 'WE',
  },
  // WE -> WO
  {
    code: 'WE2WO-IDENT',
    template:
      'At the moment when the event "{refCaption}" occurred, which of the following objects appeared?',
    answerType: 'WO',
    referenceType: 'WE',
  },
  {
    code: 'WE2WO-EXIST',
    template:
      'At the moment when the event "{refCaption}" occurred, did the object "{caption}" appear?',
    answerType: 'WO',
    referenceType: 'WE',
  },
  {
    code: 'WE2WO-ABSENT',
    template: 'At the moment when the event "{refCaption}" occurred, which object did NOT appear?',
    answerType: 'WO',
    referenceType: 'WE',
  },
];

// Level 2 Timeline Reference templates (TR2Y) - Direct timestamp reference
// Uses {timestamp} placeholder for formatted time range like "[00:01 to 00:12]"
export const LEVEL2_TR_TEMPLATES: QuestionTemplate[] = [
  // TR -> SA
  {
    code: 'TR2SA-IDENT',
    template: 'During {timestamp}, which of the following actions did the POV player perform?',
    answerType: 'SA',
  },
  {
    code: 'TR2SA-EXIST',
    template: 'During {timestamp}, did the POV player perform the action: "{caption}"?',
    answerType: 'SA',
  },
  {
    code: 'TR2SA-ABSENT',
    template: 'During {timestamp}, which action did the POV player NOT perform?',
    answerType: 'SA',
  },
  // TR -> SS
  {
    code: 'TR2SS-IDENT',
    template: "During {timestamp}, which of the following best describes the POV player's state?",
    answerType: 'SS',
  },
  {
    code: 'TR2SS-EXIST',
    template: 'During {timestamp}, can you describe the POV player\'s state as: "{caption}"?',
    answerType: 'SS',
  },
  {
    code: 'TR2SS-ABSENT',
    template:
      "During {timestamp}, which of the following does NOT describe the POV player's state?",
    answerType: 'SS',
  },
  // TR -> OA
  {
    code: 'TR2OA-IDENT',
    template: 'During {timestamp}, which of the following actions did {other} perform?',
    answerType: 'OA',
  },
  {
    code: 'TR2OA-EXIST',
    template: 'During {timestamp}, did {other} perform the action: "{caption}"?',
    answerType: 'OA',
  },
  {
    code: 'TR2OA-ABSENT',
    template: 'During {timestamp}, which action did {other} NOT perform?',
    answerType: 'OA',
  },
  // TR -> OS
  {
    code: 'TR2OS-IDENT',
    template: "During {timestamp}, which of the following best describes {other}'s state?",
    answerType: 'OS',
  },
  {
    code: 'TR2OS-EXIST',
    template: 'During {timestamp}, can you describe {other}\'s state as: "{caption}"?',
    answerType: 'OS',
  },
  {
    code: 'TR2OS-ABSENT',
    template: "During {timestamp}, which of the following does NOT describe {other}'s state?",
    answerType: 'OS',
  },
  // TR -> WO
  {
    code: 'TR2WO-IDENT',
    template: 'During {timestamp}, which of the following objects appeared?',
    answerType: 'WO',
  },
  {
    code: 'TR2WO-EXIST',
    template: 'During {timestamp}, did the object "{caption}" appear?',
    answerType: 'WO',
  },
  {
    code: 'TR2WO-ABSENT',
    template: 'During {timestamp}, which object did NOT appear?',
    answerType: 'WO',
  },
  // TR -> WE
  {
    code: 'TR2WE-IDENT',
    template: 'During {timestamp}, which of the following events occurred?',
    answerType: 'WE',
  },
  {
    code: 'TR2WE-EXIST',
    template: 'During {timestamp}, did the event "{caption}" occur?',
    answerType: 'WE',
  },
  {
    code: 'TR2WE-ABSENT',
    template: 'During {timestamp}, which of the following events did NOT occur?',
    answerType: 'WE',
  },
];

// Level 3 question templates (Cross-Video Relation)
// Level 3 templates: All combinations of V1-{X}2V2-{Y}-{SUFFIX}
// Reference types (X): SA, SS, OA, OS, WO, WE
// Answer types (Y): SA, SS, OA, OS, WO, WE
// Suffixes: IDENT, EXIST
export const LEVEL3_TEMPLATES: QuestionTemplate[] = [
  // SA as Reference -> All targets
  {
    code: 'V1-SA2V2-SA-IDENT',
    template:
      'When POV1 player was performing the action: "{refCaption}", which of the following actions did POV2 player perform at the same time?',
    answerType: 'SA',
    referenceType: 'SA',
  },
  {
    code: 'V1-SA2V2-SA-EXIST',
    template:
      'When POV1 player was performing the action: "{refCaption}", did POV2 player perform the action: "{caption}" at the same time?',
    answerType: 'SA',
    referenceType: 'SA',
  },
  {
    code: 'V1-SA2V2-SS-IDENT',
    template:
      'When POV1 player was performing the action: "{refCaption}", which of the following best describes POV2 player\'s state at the same time?',
    answerType: 'SS',
    referenceType: 'SA',
  },
  {
    code: 'V1-SA2V2-SS-EXIST',
    template:
      'When POV1 player was performing the action: "{refCaption}", was POV2 player\'s "{caption}" at the same time?',
    answerType: 'SS',
    referenceType: 'SA',
  },
  {
    code: 'V1-SA2V2-OA-IDENT',
    template:
      'When POV1 player was performing the action: "{refCaption}", which of the following actions did {other} perform in POV2 at the same time?',
    answerType: 'OA',
    referenceType: 'SA',
  },
  {
    code: 'V1-SA2V2-OA-EXIST',
    template:
      'When POV1 player was performing the action: "{refCaption}", did {other} perform the action: "{caption}" in POV2 at the same time?',
    answerType: 'OA',
    referenceType: 'SA',
  },
  {
    code: 'V1-SA2V2-OS-IDENT',
    template:
      'When POV1 player was performing the action: "{refCaption}", which of the following best describes {other}\'s state in POV2 at the same time?',
    answerType: 'OS',
    referenceType: 'SA',
  },
  {
    code: 'V1-SA2V2-OS-EXIST',
    template:
      'When POV1 player was performing the action: "{refCaption}", was {other}\'s "{caption}" in POV2 at the same time?',
    answerType: 'OS',
    referenceType: 'SA',
  },
  {
    code: 'V1-SA2V2-WO-IDENT',
    template:
      'When POV1 player was performing the action: "{refCaption}", which of the following objects appeared in POV2 at the same time?',
    answerType: 'WO',
    referenceType: 'SA',
  },
  {
    code: 'V1-SA2V2-WO-EXIST',
    template:
      'When POV1 player was performing the action: "{refCaption}", did the object "{caption}" appear in POV2 at the same time?',
    answerType: 'WO',
    referenceType: 'SA',
  },
  {
    code: 'V1-SA2V2-WE-IDENT',
    template:
      'When POV1 player was performing the action: "{refCaption}", which of the following events occurred in POV2 at the same time?',
    answerType: 'WE',
    referenceType: 'SA',
  },
  {
    code: 'V1-SA2V2-WE-EXIST',
    template:
      'When POV1 player was performing the action: "{refCaption}", did the event "{caption}" occur in POV2 at the same time?',
    answerType: 'WE',
    referenceType: 'SA',
  },

  // SS as Reference -> All targets
  {
    code: 'V1-SS2V2-SA-IDENT',
    template:
      'When POV1 player\'s "{refCaption}", which of the following actions did POV2 player perform at the same time?',
    answerType: 'SA',
    referenceType: 'SS',
  },
  {
    code: 'V1-SS2V2-SA-EXIST',
    template:
      'When POV1 player\'s "{refCaption}", did POV2 player perform the action: "{caption}" at the same time?',
    answerType: 'SA',
    referenceType: 'SS',
  },
  {
    code: 'V1-SS2V2-SS-IDENT',
    template:
      'When POV1 player\'s "{refCaption}", which of the following best describes POV2 player\'s state at the same time?',
    answerType: 'SS',
    referenceType: 'SS',
  },
  {
    code: 'V1-SS2V2-SS-EXIST',
    template:
      'When POV1 player\'s "{refCaption}", was POV2 player\'s "{caption}" at the same time?',
    answerType: 'SS',
    referenceType: 'SS',
  },
  {
    code: 'V1-SS2V2-OA-IDENT',
    template:
      'When POV1 player\'s "{refCaption}", which of the following actions did {other} perform in POV2 at the same time?',
    answerType: 'OA',
    referenceType: 'SS',
  },
  {
    code: 'V1-SS2V2-OA-EXIST',
    template:
      'When POV1 player\'s "{refCaption}", did {other} perform the action: "{caption}" in POV2 at the same time?',
    answerType: 'OA',
    referenceType: 'SS',
  },
  {
    code: 'V1-SS2V2-OS-IDENT',
    template:
      'When POV1 player\'s "{refCaption}", which of the following best describes {other}\'s state in POV2 at the same time?',
    answerType: 'OS',
    referenceType: 'SS',
  },
  {
    code: 'V1-SS2V2-OS-EXIST',
    template:
      'When POV1 player\'s "{refCaption}", was {other}\'s "{caption}" in POV2 at the same time?',
    answerType: 'OS',
    referenceType: 'SS',
  },
  {
    code: 'V1-SS2V2-WO-IDENT',
    template:
      'When POV1 player\'s "{refCaption}", which of the following objects appeared in POV2 at the same time?',
    answerType: 'WO',
    referenceType: 'SS',
  },
  {
    code: 'V1-SS2V2-WO-EXIST',
    template:
      'When POV1 player\'s "{refCaption}", did the object "{caption}" appear in POV2 at the same time?',
    answerType: 'WO',
    referenceType: 'SS',
  },
  {
    code: 'V1-SS2V2-WE-IDENT',
    template:
      'When POV1 player\'s "{refCaption}", which of the following events occurred in POV2 at the same time?',
    answerType: 'WE',
    referenceType: 'SS',
  },
  {
    code: 'V1-SS2V2-WE-EXIST',
    template:
      'When POV1 player\'s "{refCaption}", did the event "{caption}" occur in POV2 at the same time?',
    answerType: 'WE',
    referenceType: 'SS',
  },

  // OA as Reference -> All targets
  {
    code: 'V1-OA2V2-SA-IDENT',
    template:
      'When {refOther} was performing the action: "{refCaption}" in POV1, which of the following actions did POV2 player perform at the same time?',
    answerType: 'SA',
    referenceType: 'OA',
  },
  {
    code: 'V1-OA2V2-SA-EXIST',
    template:
      'When {refOther} was performing the action: "{refCaption}" in POV1, did POV2 player perform the action: "{caption}" at the same time?',
    answerType: 'SA',
    referenceType: 'OA',
  },
  {
    code: 'V1-OA2V2-SS-IDENT',
    template:
      'When {refOther} was performing the action: "{refCaption}" in POV1, which of the following best describes POV2 player\'s state at the same time?',
    answerType: 'SS',
    referenceType: 'OA',
  },
  {
    code: 'V1-OA2V2-SS-EXIST',
    template:
      'When {refOther} was performing the action: "{refCaption}" in POV1, was POV2 player\'s "{caption}" at the same time?',
    answerType: 'SS',
    referenceType: 'OA',
  },
  {
    code: 'V1-OA2V2-OA-IDENT',
    template:
      'When {refOther} was performing the action: "{refCaption}" in POV1, which of the following actions did {other} perform in POV2 at the same time?',
    answerType: 'OA',
    referenceType: 'OA',
  },
  {
    code: 'V1-OA2V2-OA-EXIST',
    template:
      'When {refOther} was performing the action: "{refCaption}" in POV1, did {other} perform the action: "{caption}" in POV2 at the same time?',
    answerType: 'OA',
    referenceType: 'OA',
  },
  {
    code: 'V1-OA2V2-OS-IDENT',
    template:
      'When {refOther} was performing the action: "{refCaption}" in POV1, which of the following best describes {other}\'s state in POV2 at the same time?',
    answerType: 'OS',
    referenceType: 'OA',
  },
  {
    code: 'V1-OA2V2-OS-EXIST',
    template:
      'When {refOther} was performing the action: "{refCaption}" in POV1, was {other}\'s "{caption}" in POV2 at the same time?',
    answerType: 'OS',
    referenceType: 'OA',
  },
  {
    code: 'V1-OA2V2-WO-IDENT',
    template:
      'When {refOther} was performing the action: "{refCaption}" in POV1, which of the following objects appeared in POV2 at the same time?',
    answerType: 'WO',
    referenceType: 'OA',
  },
  {
    code: 'V1-OA2V2-WO-EXIST',
    template:
      'When {refOther} was performing the action: "{refCaption}" in POV1, did the object "{caption}" appear in POV2 at the same time?',
    answerType: 'WO',
    referenceType: 'OA',
  },
  {
    code: 'V1-OA2V2-WE-IDENT',
    template:
      'When {refOther} was performing the action: "{refCaption}" in POV1, which of the following events occurred in POV2 at the same time?',
    answerType: 'WE',
    referenceType: 'OA',
  },
  {
    code: 'V1-OA2V2-WE-EXIST',
    template:
      'When {refOther} was performing the action: "{refCaption}" in POV1, did the event "{caption}" occur in POV2 at the same time?',
    answerType: 'WE',
    referenceType: 'OA',
  },

  // OS as Reference -> All targets
  {
    code: 'V1-OS2V2-SA-IDENT',
    template:
      'When {refOther}\'s "{refCaption}" in POV1, which of the following actions did POV2 player perform at the same time?',
    answerType: 'SA',
    referenceType: 'OS',
  },
  {
    code: 'V1-OS2V2-SA-EXIST',
    template:
      'When {refOther}\'s "{refCaption}" in POV1, did POV2 player perform the action: "{caption}" at the same time?',
    answerType: 'SA',
    referenceType: 'OS',
  },
  {
    code: 'V1-OS2V2-SS-IDENT',
    template:
      'When {refOther}\'s "{refCaption}" in POV1, which of the following best describes POV2 player\'s state at the same time?',
    answerType: 'SS',
    referenceType: 'OS',
  },
  {
    code: 'V1-OS2V2-SS-EXIST',
    template:
      'When {refOther}\'s "{refCaption}" in POV1, was POV2 player\'s "{caption}" at the same time?',
    answerType: 'SS',
    referenceType: 'OS',
  },
  {
    code: 'V1-OS2V2-OA-IDENT',
    template:
      'When {refOther}\'s "{refCaption}" in POV1, which of the following actions did {other} perform in POV2 at the same time?',
    answerType: 'OA',
    referenceType: 'OS',
  },
  {
    code: 'V1-OS2V2-OA-EXIST',
    template:
      'When {refOther}\'s "{refCaption}" in POV1, did {other} perform the action: "{caption}" in POV2 at the same time?',
    answerType: 'OA',
    referenceType: 'OS',
  },
  {
    code: 'V1-OS2V2-OS-IDENT',
    template:
      'When {refOther}\'s "{refCaption}" in POV1, which of the following best describes {other}\'s state in POV2 at the same time?',
    answerType: 'OS',
    referenceType: 'OS',
  },
  {
    code: 'V1-OS2V2-OS-EXIST',
    template:
      'When {refOther}\'s "{refCaption}" in POV1, was {other}\'s "{caption}" in POV2 at the same time?',
    answerType: 'OS',
    referenceType: 'OS',
  },
  {
    code: 'V1-OS2V2-WO-IDENT',
    template:
      'When {refOther}\'s "{refCaption}" in POV1, which of the following objects appeared in POV2 at the same time?',
    answerType: 'WO',
    referenceType: 'OS',
  },
  {
    code: 'V1-OS2V2-WO-EXIST',
    template:
      'When {refOther}\'s "{refCaption}" in POV1, did the object "{caption}" appear in POV2 at the same time?',
    answerType: 'WO',
    referenceType: 'OS',
  },
  {
    code: 'V1-OS2V2-WE-IDENT',
    template:
      'When {refOther}\'s "{refCaption}" in POV1, which of the following events occurred in POV2 at the same time?',
    answerType: 'WE',
    referenceType: 'OS',
  },
  {
    code: 'V1-OS2V2-WE-EXIST',
    template:
      'When {refOther}\'s "{refCaption}" in POV1, did the event "{caption}" occur in POV2 at the same time?',
    answerType: 'WE',
    referenceType: 'OS',
  },

  // WO as Reference -> All targets
  {
    code: 'V1-WO2V2-SA-IDENT',
    template:
      'When the object "{refCaption}" appeared in POV1, which of the following actions did POV2 player perform at the same time?',
    answerType: 'SA',
    referenceType: 'WO',
  },
  {
    code: 'V1-WO2V2-SA-EXIST',
    template:
      'When the object "{refCaption}" appeared in POV1, did POV2 player perform the action: "{caption}" at the same time?',
    answerType: 'SA',
    referenceType: 'WO',
  },
  {
    code: 'V1-WO2V2-SS-IDENT',
    template:
      'When the object "{refCaption}" appeared in POV1, which of the following best describes POV2 player\'s state at the same time?',
    answerType: 'SS',
    referenceType: 'WO',
  },
  {
    code: 'V1-WO2V2-SS-EXIST',
    template:
      'When the object "{refCaption}" appeared in POV1, was POV2 player\'s "{caption}" at the same time?',
    answerType: 'SS',
    referenceType: 'WO',
  },
  {
    code: 'V1-WO2V2-OA-IDENT',
    template:
      'When the object "{refCaption}" appeared in POV1, which of the following actions did {other} perform in POV2 at the same time?',
    answerType: 'OA',
    referenceType: 'WO',
  },
  {
    code: 'V1-WO2V2-OA-EXIST',
    template:
      'When the object "{refCaption}" appeared in POV1, did {other} perform the action: "{caption}" in POV2 at the same time?',
    answerType: 'OA',
    referenceType: 'WO',
  },
  {
    code: 'V1-WO2V2-OS-IDENT',
    template:
      'When the object "{refCaption}" appeared in POV1, which of the following best describes {other}\'s state in POV2 at the same time?',
    answerType: 'OS',
    referenceType: 'WO',
  },
  {
    code: 'V1-WO2V2-OS-EXIST',
    template:
      'When the object "{refCaption}" appeared in POV1, was {other}\'s "{caption}" in POV2 at the same time?',
    answerType: 'OS',
    referenceType: 'WO',
  },
  {
    code: 'V1-WO2V2-WO-IDENT',
    template:
      'When the object "{refCaption}" appeared in POV1, which of the following objects appeared in POV2 at the same time?',
    answerType: 'WO',
    referenceType: 'WO',
  },
  {
    code: 'V1-WO2V2-WO-EXIST',
    template:
      'When the object "{refCaption}" appeared in POV1, did the object "{caption}" appear in POV2 at the same time?',
    answerType: 'WO',
    referenceType: 'WO',
  },
  {
    code: 'V1-WO2V2-WE-IDENT',
    template:
      'When the object "{refCaption}" appeared in POV1, which of the following events occurred in POV2 at the same time?',
    answerType: 'WE',
    referenceType: 'WO',
  },
  {
    code: 'V1-WO2V2-WE-EXIST',
    template:
      'When the object "{refCaption}" appeared in POV1, did the event "{caption}" occur in POV2 at the same time?',
    answerType: 'WE',
    referenceType: 'WO',
  },

  // WE as Reference -> All targets
  {
    code: 'V1-WE2V2-SA-IDENT',
    template:
      'At the moment when the event "{refCaption}" occurred in POV1, which of the following actions did POV2 player perform at the same time?',
    answerType: 'SA',
    referenceType: 'WE',
  },
  {
    code: 'V1-WE2V2-SA-EXIST',
    template:
      'At the moment when the event "{refCaption}" occurred in POV1, did POV2 player perform the action: "{caption}" at the same time?',
    answerType: 'SA',
    referenceType: 'WE',
  },
  {
    code: 'V1-WE2V2-SS-IDENT',
    template:
      'At the moment when the event "{refCaption}" occurred in POV1, which of the following best describes POV2 player\'s state at the same time?',
    answerType: 'SS',
    referenceType: 'WE',
  },
  {
    code: 'V1-WE2V2-SS-EXIST',
    template:
      'At the moment when the event "{refCaption}" occurred in POV1, was POV2 player\'s "{caption}" at the same time?',
    answerType: 'SS',
    referenceType: 'WE',
  },
  {
    code: 'V1-WE2V2-OA-IDENT',
    template:
      'At the moment when the event "{refCaption}" occurred in POV1, which of the following actions did {other} perform in POV2 at the same time?',
    answerType: 'OA',
    referenceType: 'WE',
  },
  {
    code: 'V1-WE2V2-OA-EXIST',
    template:
      'At the moment when the event "{refCaption}" occurred in POV1, did {other} perform the action: "{caption}" in POV2 at the same time?',
    answerType: 'OA',
    referenceType: 'WE',
  },
  {
    code: 'V1-WE2V2-OS-IDENT',
    template:
      'At the moment when the event "{refCaption}" occurred in POV1, which of the following best describes {other}\'s state in POV2 at the same time?',
    answerType: 'OS',
    referenceType: 'WE',
  },
  {
    code: 'V1-WE2V2-OS-EXIST',
    template:
      'At the moment when the event "{refCaption}" occurred in POV1, was {other}\'s "{caption}" in POV2 at the same time?',
    answerType: 'OS',
    referenceType: 'WE',
  },
  {
    code: 'V1-WE2V2-WO-IDENT',
    template:
      'At the moment when the event "{refCaption}" occurred in POV1, which of the following objects appeared in POV2 at the same time?',
    answerType: 'WO',
    referenceType: 'WE',
  },
  {
    code: 'V1-WE2V2-WO-EXIST',
    template:
      'At the moment when the event "{refCaption}" occurred in POV1, did the object "{caption}" appear in POV2 at the same time?',
    answerType: 'WO',
    referenceType: 'WE',
  },
  {
    code: 'V1-WE2V2-WE-IDENT',
    template:
      'At the moment when the event "{refCaption}" occurred in POV1, which of the following events occurred in POV2 at the same time?',
    answerType: 'WE',
    referenceType: 'WE',
  },
  {
    code: 'V1-WE2V2-WE-EXIST',
    template:
      'At the moment when the event "{refCaption}" occurred in POV1, did the event "{caption}" occur in POV2 at the same time?',
    answerType: 'WE',
    referenceType: 'WE',
  },
];

// Level 3 POV-ID templates: Identity & Attribution - Which video corresponds to player who did X?
// Answer is a video number, distractors are other video numbers
export const LEVEL3_POV_ID_TEMPLATES: QuestionTemplate[] = [
  {
    code: 'SA-POV-ID',
    template: 'Which video corresponds to the player who performed the action: "{caption}"?',
    answerType: 'SA',
  },
  {
    code: 'SS-POV-ID',
    template: 'Which video corresponds to the player whose "{caption}"?',
    answerType: 'SS',
  },
  {
    code: 'OA-POV-ID',
    template: 'Which video shows {other} performing the action: "{caption}"?',
    answerType: 'OA',
  },
  {
    code: 'OS-POV-ID',
    template: 'Which video shows {other} whose "{caption}"?',
    answerType: 'OS',
  },
  {
    code: 'WO-POV-ID',
    template: 'Which video shows the object "{caption}"?',
    answerType: 'WO',
  },
  {
    code: 'WE-POV-ID',
    template: 'Which video shows the event "{caption}"?',
    answerType: 'WE',
  },
];

// Level 3 ORDER templates: Temporal Ordering Across Videos - Which happened first?
// Answer is a formatted event description with video number
// ORDER templates - only SA (self action) is supported
// Options are formatted as "The POV player in Video X is [action]"
export const LEVEL3_ORDER_TEMPLATES: QuestionTemplate[] = [
  {
    code: 'SA-ORDER',
    template: 'Which of the following actions happened first?',
    answerType: 'SA',
  },
];
