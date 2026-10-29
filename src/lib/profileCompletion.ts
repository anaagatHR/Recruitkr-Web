// The exact scoring function the server gates on (backend/src/shared). The UI
// uses it only to update the completion ring live while the candidate types;
// whether they can apply is always decided server-side.
export {
  APPLY_GATE_MIN_SCORE,
  computeProfileCompletion,
} from "../../backend/src/shared/profileCompletion.js";

export type CompletionGroup = "identity" | "professional" | "preferences" | "proof";

export type CompletionField = {
  key: string;
  label: string;
  weight: number;
  required: boolean;
  group: CompletionGroup;
  points: number;
  satisfied: boolean;
};

export type CompletionResult = {
  score: number;
  threshold: number;
  canApply: boolean;
  fields: CompletionField[];
};
