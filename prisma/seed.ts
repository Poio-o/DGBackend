import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

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

async function main() {
  const dataFilePath = path.join(__dirname, 'digimons_data.json');
  console.log(`Cargando datos desde ${dataFilePath}...`);

  const rawData = fs.readFileSync(dataFilePath, 'utf-8');
  const data: PreparedData = JSON.parse(rawData);

  console.log(`Insertando ${data.species.length} especies...`);
  const speciesData = data.species.map((s) => ({
    speciesId: s.species_id,
    name: s.name,
    generation: s.generation,
    attribute: s.attribute,
    type: s.type,
    spriteUrl: s.sprite_url,
    fullImageUrl: s.full_image_url || null,
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
  console.log('Especies insertadas correctamente.');

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
  console.log('Rutas de evolución insertadas correctamente.');
  console.log('Seed finalizado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
