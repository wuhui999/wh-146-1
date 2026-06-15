export interface Oil {
  id: string;
  name: string;
  sap: number;
  naoh: number;
  koh: number;
  hardness: number;
  cleansing: number;
  conditioning: number;
  bubbly: number;
  creamy: number;
  iodine: number;
  ins: number;
  category: string;
}

export interface RecipeOil {
  oilId: string;
  weight: number;
}

export interface Additive {
  id: string;
  name: string;
  type: 'fragrance' | 'colorant' | 'exfoliant' | 'other';
  amount: number;
  unit: string;
  note?: string;
}

export interface CalcConfig {
  baseGelTimeHours: number;
  baseDemoldMinHours: number;
  baseDemoldMaxHours: number;
  tempFactorPerDegree: number;
  superFatDelayFactor: number;
  additiveDelayPerItem: number;
  waterRatio: number;
}

export interface Recipe {
  id: string;
  name: string;
  oils: RecipeOil[];
  superFatPercent: number;
  lyeType: 'NaOH' | 'KOH';
  waterRatio: number;
  additives: Additive[];
  ambientTemp: number;
  targetTemp: number;
  createdAt: number;
  updatedAt: number;
}

export interface BatchNotes {
  id: string;
  recipeId: string;
  fragranceEval: number;
  hardnessEval: number;
  colorNote: string;
  textureNote: string;
  issues: string;
  successes: string;
  overallRating: number;
  demoldDate?: number;
  createdAt: number;
}

export interface SaponificationResult {
  totalOilWeight: number;
  lyeWeight: number;
  lyeWeightWithSuperFat: number;
  waterWeight: number;
  totalBatchWeight: number;
  gelPointEstimateHours: number;
  stirEndEstimateMinutes: number;
  demoldWindow: {
    minHours: number;
    maxHours: number;
  };
  cureEstimateDays: number;
  soapProfile: {
    hardness: number;
    cleansing: number;
    conditioning: number;
    bubbly: number;
    creamy: number;
    iodine: number;
    ins: number;
  };
}

export interface Batch {
  id: string;
  recipe: Recipe;
  notes?: BatchNotes;
  startTimestamp?: number;
  status: 'draft' | 'mixing' | 'gelling' | 'curing' | 'completed';
}
