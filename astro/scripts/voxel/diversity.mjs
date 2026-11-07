import assert from 'node:assert/strict';
import {rules} from './validate.mjs';
export function auditDiversity(report) {
 const d=report.diversity,require=(ok,message)=>assert(ok,`VXL-DIVERSITY: ${message}`);
 require(report.naturalSeeds>=rules.atlasSeeds,'insufficient seed coverage');
 require(d.biomes>=rules.minBiomes&&d.landforms>=rules.minLandforms,'biome/landform coverage');
 require(d.houseCounts>=rules.minHouseCounts&&report.emptySettlements>0,'forced or fixed buildings');
 require(d.boatCounts>=rules.minBoatCounts&&report.zeroBoats>0,'forced or fixed boats');
 require(d.dimensions>=rules.minDimensions,'fixed dimensions');
 require(d.houseRecipes>=rules.minHouseRecipes&&d.houseSites>=20,'fixed house shape or placement');
 require(d.treeCounts>=12,'fixed vegetation counts');
 require(report.mixed>=rules.minMixedWorlds,'missing biome transitions');
}
