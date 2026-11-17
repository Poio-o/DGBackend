import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const CLOUDINARY_BASE_URL =
  process.env.CLOUDINARY_BASE_URL ||
  'https://res.cloudinary.com/mjznyz3n/image/upload';

interface PreparedSpecies {
  species_id: string;
  name: string;
  generation: string;
  attribute: string;
  type: string;
  sprite_url: string;
  full_image_url?: string;
  description?: string;
  base_hp: number;
  base_sp: number;
  base_atk: number;
  base_def: number;
  base_int: number;
  base_spi: number;
  base_spd: number;
}

interface PreparedEvolution {
  id: number;
  from_species_id: string;
  to_species_id: string;
  min_level: number;
  min_friendship: number;
  min_hp: number;
  min_sp: number;
  min_atk: number;
  min_def: number;
  min_int: number;
  min_spi: number;
  min_spd: number;
  required_item_id?: string | null;
}

interface PreparedData {
  total_species: number;
  total_evolution_paths: number;
  species: PreparedSpecies[];
  evolution_paths: PreparedEvolution[];
}

const INITIAL_ITEMS = [
  {
    itemId: 'meat_giant',
    name: 'Carne Gigante',
    category: 'COMIDA',
    description: 'Carne jugosa del Digimundo. Restaura 40 puntos de hambre y otorga +5 de amistad.',
    iconUrl: `${CLOUDINARY_BASE_URL}/DGImages/Items/giant_meat.png`,
    isStackable: true,
    maxStack: 99,
    usablePlatform: 'AMBAS',
    price: 100,
    hungerRestored: 40,
    friendshipGain: 5,
    fatigueRestored: 0,
    weightChange: 1,
    statBoostType: 'NINGUNA',
    statBoostValue: 0,
    walkMultiplier: 1.0,
    walkDurationSteps: 0,
    stepsToHatch: 0,
  },
  {
    itemId: 'apple_digital',
    name: 'Manzana Digital',
    category: 'COMIDA',
    description: 'Fruta silvestre refrescante. Restaura 20 de hambre y reduce 10 puntos de cansancio.',
    iconUrl: `${CLOUDINARY_BASE_URL}/DGImages/Items/digital_apple.png`,
    isStackable: true,
    maxStack: 99,
    usablePlatform: 'AMBAS',
    price: 50,
    hungerRestored: 20,
    friendshipGain: 2,
    fatigueRestored: 10,
    weightChange: 0,
    statBoostType: 'NINGUNA',
    statBoostValue: 0,
    walkMultiplier: 1.0,
    walkDurationSteps: 0,
    stepsToHatch: 0,
  },
  {
    itemId: 'chip_atk',
    name: 'Chip de Ataque V1',
    category: 'CHIP_STATS',
    description: 'Circuito de sobrecarga que aumenta permanentemente +5 de Ataque (ATK).',
    iconUrl: `${CLOUDINARY_BASE_URL}/DGImages/Items/chip_atk.png`,
    isStackable: true,
    maxStack: 20,
    usablePlatform: 'WEB',
    price: 500,
    hungerRestored: 0,
    friendshipGain: 0,
    fatigueRestored: 0,
    weightChange: 0,
    statBoostType: 'ATK',
    statBoostValue: 5,
    walkMultiplier: 1.0,
    walkDurationSteps: 0,
    stepsToHatch: 0,
  },
  {
    itemId: 'friendship_spray',
    name: 'Spray de Amistad',
    category: 'POTENCIADOR_PASEO',
    description: 'Duplica la ganancia de amistad por pasos durante 2.000 pasos en DGWalker.',
    iconUrl: `${CLOUDINARY_BASE_URL}/DGImages/Items/friendship_spray.png`,
    isStackable: true,
    maxStack: 10,
    usablePlatform: 'MOVIL',
    price: 300,
    hungerRestored: 0,
    friendshipGain: 0,
    fatigueRestored: 0,
    weightChange: 0,
    statBoostType: 'NINGUNA',
    statBoostValue: 0,
    walkMultiplier: 2.0,
    walkDurationSteps: 2000,
    stepsToHatch: 0,
  },
  {
    itemId: 'egg_fire',
    name: 'Digihuevo de Fuego',
    category: 'HUEVO',
    description: 'Huevo caliente al tacto. Eclosiona tras caminar 5.000 pasos en DGWalker.',
    iconUrl: `${CLOUDINARY_BASE_URL}/DGImages/Items/fire_egg.png`,
    isStackable: false,
    maxStack: 1,
    usablePlatform: 'AMBAS',
    price: 1000,
    hungerRestored: 0,
    friendshipGain: 0,
    fatigueRestored: 0,
    weightChange: 0,
    statBoostType: 'NINGUNA',
    statBoostValue: 0,
    walkMultiplier: 1.0,
    walkDurationSteps: 0,
    stepsToHatch: 5000,
  },
];

function toCloudinaryName(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

function getSpriteUrl(rawPath: string): string {
  const filename = path.basename(rawPath);
  return `${CLOUDINARY_BASE_URL}/${toCloudinaryName(filename)}`;
}

function getFullImageUrl(rawPath?: string | null): string | null {
  if (!rawPath) return null;

  const parts = rawPath.split('/');
  const filename = parts.pop();
  const folder = parts.join('/').replace('img/', 'DGImages/');

  return `${CLOUDINARY_BASE_URL}/${folder}/${toCloudinaryName(filename!)}`;
}

async function main() {
  const dataFilePath = path.join(__dirname, 'digimons_data.json');
  console.log(`Cargando dataset desde ${dataFilePath}...`);

  const rawData = fs.readFileSync(dataFilePath, 'utf-8');
  const data: PreparedData = JSON.parse(rawData);

  console.log('Limpiando catálogo previo...');
  await prisma.evolutionPath.deleteMany();
  await prisma.digimonSpecies.deleteMany();

  console.log(`Insertando ${data.species.length} especies con URLs de Cloudinary...`);
  const speciesData = data.species.map((s) => ({
    speciesId: s.species_id,
    name: s.name,
    generation: s.generation,
    attribute: s.attribute,
    type: s.type,
    spriteUrl: getSpriteUrl(s.sprite_url),
    fullImageUrl: getFullImageUrl(s.full_image_url),
    baseHp: s.base_hp,
    baseSp: s.base_sp,
    baseAtk: s.base_atk,
    baseDef: s.base_def,
    baseInt: s.base_int,
    baseSpi: s.base_spi,
    baseSpd: s.base_spd,
    description: s.description || null,
  }));

  const BATCH_SIZE = 100;
  for (let i = 0; i < speciesData.length; i += BATCH_SIZE) {
    const batch = speciesData.slice(i, i + BATCH_SIZE);
    await prisma.digimonSpecies.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
  console.log('Especies insertadas.');

  console.log(`Insertando ${data.evolution_paths.length} rutas de evolución...`);
  const evoData = data.evolution_paths.map((e) => ({
    id: e.id,
    fromSpeciesId: e.from_species_id,
    toSpeciesId: e.to_species_id,
    minLevel: e.min_level,
    minFriendship: e.min_friendship,
    minHp: e.min_hp,
    minSp: e.min_sp,
    minAtk: e.min_atk,
    minDef: e.min_def,
    minInt: e.min_int,
    minSpi: e.min_spi,
    minSpd: e.min_spd,
    requiredItemId: e.required_item_id || null,
  }));

  const EVO_BATCH_SIZE = 200;
  for (let i = 0; i < evoData.length; i += EVO_BATCH_SIZE) {
    const batch = evoData.slice(i, i + EVO_BATCH_SIZE);
    await prisma.evolutionPath.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
  console.log('Rutas de evolución insertadas.');

  console.log(`Insertando ${INITIAL_ITEMS.length} items en items_catalog...`);
  for (const item of INITIAL_ITEMS) {
    await prisma.item.upsert({
      where: { itemId: item.itemId },
      update: item,
      create: item,
    });
  }
  console.log('Seed finalizado.');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
