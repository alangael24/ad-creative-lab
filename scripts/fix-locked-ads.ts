// Script para arreglar ads que tienen isLocked=true pero no estan en testing
// Ejecutar con: npx tsx scripts/fix-locked-ads.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Encontrar ads con isLocked=true que no estan en testing
  const badAds = await prisma.ad.findMany({
    where: {
      isLocked: true,
      status: { not: 'testing' },
    },
  })

  console.log(`Encontrados ${badAds.length} ads con estado inconsistente:`)

  for (const ad of badAds) {
    console.log(`- ${ad.name} (status: ${ad.status}, isLocked: ${ad.isLocked})`)
  }

  if (badAds.length > 0) {
    // Arreglarlos
    const result = await prisma.ad.updateMany({
      where: {
        isLocked: true,
        status: { not: 'testing' },
      },
      data: {
        isLocked: false,
      },
    })

    console.log(`\nArreglados ${result.count} ads`)
  } else {
    console.log('\nNo hay ads que arreglar')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
