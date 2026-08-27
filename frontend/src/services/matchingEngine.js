/**
 * RoomieSync Compatibility Engine Algorithm
 * Calculates compatibility percentage between current user and candidates based on weighted lifestyle factors.
 */
export function calculateCompatibility(userProfile, candidateProfile) {
  if (!userProfile || !candidateProfile) return 50;

  let totalScore = 0;
  
  // 1. Budget Overlap (25% weight)
  const uBudget = Array.isArray(userProfile?.budget) && userProfile.budget.length === 2 ? userProfile.budget : [10000, 25000];
  const cBudget = Array.isArray(candidateProfile?.budget) && candidateProfile.budget.length === 2 ? candidateProfile.budget : [10000, 25000];
  const uMin = Number(uBudget[0]) || 10000;
  const uMax = Number(uBudget[1]) || 25000;
  const cMin = Number(cBudget[0]) || 10000;
  const cMax = Number(cBudget[1]) || 25000;

  const overlapMin = Math.max(uMin, cMin);
  const overlapMax = Math.min(uMax, cMax);
  if (overlapMin <= overlapMax) {
    totalScore += 25; // Good budget alignment
  } else {
    const diff = Math.min(Math.abs(uMin - cMax), Math.abs(cMin - uMax));
    totalScore += Math.max(0, 25 - (diff / 500));
  }

  // 2. Food Preference (20% weight)
  const uFood = userProfile?.foodPref || '';
  const cFood = candidateProfile?.foodPref || '';
  if (uFood && cFood && uFood === cFood) {
    totalScore += 20;
  } else if (
    (uFood === 'Veg' && cFood === 'Vegan') ||
    (uFood === 'Vegan' && cFood === 'Veg')
  ) {
    totalScore += 16;
  } else {
    totalScore += 8; // Non-veg vs Veg tolerance
  }

  // 3. Sleep Schedule (20% weight)
  const uSleep = userProfile?.sleepSchedule || '';
  const cSleep = candidateProfile?.sleepSchedule || '';
  if (uSleep && cSleep && uSleep === cSleep) {
    totalScore += 20;
  } else if (uSleep === 'Flexible' || cSleep === 'Flexible') {
    totalScore += 15;
  } else {
    totalScore += 5; // Early bird vs Night owl difference
  }

  // 4. Cleanliness Level (15% weight)
  const uClean = typeof userProfile?.cleanliness === 'number' ? userProfile.cleanliness : 4;
  const cClean = typeof candidateProfile?.cleanliness === 'number' ? candidateProfile.cleanliness : 4;
  const cleanDiff = Math.abs(uClean - cClean);
  totalScore += Math.max(0, 15 - (cleanDiff * 5));

  // 5. Smoking / Drinking Preference (10% weight)
  const uSmk = userProfile?.smokingDrinking || '';
  const cSmk = candidateProfile?.smokingDrinking || '';
  if (uSmk && cSmk && uSmk === cSmk) {
    totalScore += 10;
  } else {
    totalScore += 4;
  }

  // 6. Shared Hobbies & Location (10% weight)
  const uHobbies = Array.isArray(userProfile?.hobbies) ? userProfile.hobbies : [];
  const cHobbies = Array.isArray(candidateProfile?.hobbies) ? candidateProfile.hobbies : [];
  const shared = uHobbies.filter(h => h && cHobbies.includes(h));
  totalScore += Math.min(10, (shared.length * 4) + 2);

  return Math.min(99, Math.max(25, Math.round(totalScore || 50)));
}
