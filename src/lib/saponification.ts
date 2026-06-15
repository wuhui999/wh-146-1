import type { Recipe, SaponificationResult, CalcConfig } from '@/types';
import { getOilById, DEFAULT_CALC_CONFIG } from '@/data/oils';

export function calculateSaponification(
  recipe: Recipe,
  config: CalcConfig = DEFAULT_CALC_CONFIG
): SaponificationResult {
  const totalOilWeight = recipe.oils.reduce((sum, ro) => sum + ro.weight, 0);

  let lyeWeight = 0;
  let hardness = 0;
  let cleansing = 0;
  let conditioning = 0;
  let bubbly = 0;
  let creamy = 0;
  let iodine = 0;
  let ins = 0;

  for (const ro of recipe.oils) {
    const oil = getOilById(ro.oilId);
    if (!oil) continue;
    const ratio = totalOilWeight > 0 ? ro.weight / totalOilWeight : 0;
    const sapValue = recipe.lyeType === 'KOH' ? oil.koh : oil.naoh;
    lyeWeight += ro.weight * sapValue;
    hardness += oil.hardness * ratio;
    cleansing += oil.cleansing * ratio;
    conditioning += oil.conditioning * ratio;
    bubbly += oil.bubbly * ratio;
    creamy += oil.creamy * ratio;
    iodine += oil.iodine * ratio;
    ins += oil.ins * ratio;
  }

  const superFatMultiplier = 1 - recipe.superFatPercent / 100;
  const lyeWeightWithSuperFat = lyeWeight * superFatMultiplier;

  const waterWeight = totalOilWeight * recipe.waterRatio;
  const totalBatchWeight = totalOilWeight + lyeWeightWithSuperFat + waterWeight;

  const tempDiff = recipe.targetTemp - 25;
  const tempFactor = 1 - tempDiff * config.tempFactorPerDegree / 100;

  const superFatDelay = 1 + recipe.superFatPercent * config.superFatDelayFactor;

  const additiveDelay = 1 + recipe.additives.length * config.additiveDelayPerItem / 10;

  const hardnessFactor = 1 + (hardness - 40) * 0.005;

  const gelPointEstimateHours =
    config.baseGelTimeHours * tempFactor * superFatDelay * additiveDelay / Math.max(0.7, hardnessFactor);

  const stirEndEstimateMinutes = Math.round(
    5 + (20 * tempFactor * superFatDelay * additiveDelay) / Math.max(0.8, hardnessFactor)
  );

  const demoldMin =
    config.baseDemoldMinHours * tempFactor * superFatDelay * additiveDelay / Math.max(0.7, hardnessFactor);
  const demoldMax =
    config.baseDemoldMaxHours * tempFactor * superFatDelay * additiveDelay / Math.max(0.7, hardnessFactor);

  const cureEstimateDays = Math.round(
    28 + (iodine - 60) * 0.15 + recipe.additives.length * 0.5
  );

  return {
    totalOilWeight: Math.round(totalOilWeight * 100) / 100,
    lyeWeight: Math.round(lyeWeight * 100) / 100,
    lyeWeightWithSuperFat: Math.round(lyeWeightWithSuperFat * 100) / 100,
    waterWeight: Math.round(waterWeight * 100) / 100,
    totalBatchWeight: Math.round(totalBatchWeight * 100) / 100,
    gelPointEstimateHours: Math.round(gelPointEstimateHours * 10) / 10,
    stirEndEstimateMinutes,
    demoldWindow: {
      minHours: Math.round(demoldMin * 10) / 10,
      maxHours: Math.round(demoldMax * 10) / 10,
    },
    cureEstimateDays: Math.max(14, cureEstimateDays),
    soapProfile: {
      hardness: Math.round(hardness),
      cleansing: Math.round(cleansing),
      conditioning: Math.round(conditioning),
      bubbly: Math.round(bubbly),
      creamy: Math.round(creamy),
      iodine: Math.round(iodine),
      ins: Math.round(ins),
    },
  };
}

export function getSaponificationProgress(
  startTimestamp: number,
  result: SaponificationResult
): number {
  const elapsedHours = (Date.now() - startTimestamp) / (1000 * 60 * 60);
  const totalExpected = result.demoldWindow.maxHours;
  return Math.min(100, Math.round((elapsedHours / totalExpected) * 100));
}

export function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}

export function formatCountdown(targetDate: number): string {
  const diff = targetDate - Date.now();
  if (diff <= 0) return '已到达';
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0 || days > 0) parts.push(`${hours}时`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}分`);
  parts.push(`${seconds}秒`);
  return parts.join('');
}
