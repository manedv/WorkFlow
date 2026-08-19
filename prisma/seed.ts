import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const org = await prisma.organization.create({
    data: {
      name: 'WorkFlow Demo Organization',
    },
  });
  console.log(`Created organization: ${org.name}`);

  const saltRounds = 10;

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@workflow.local',
      passwordHash: await bcrypt.hash('admin123', saltRounds),
    },
  });

  const devUser = await prisma.user.create({
    data: {
      name: 'Developer User',
      email: 'developer@workflow.local',
      passwordHash: await bcrypt.hash('developer123', saltRounds),
    },
  });

  const testerUser = await prisma.user.create({
    data: {
      name: 'Tester User',
      email: 'tester@workflow.local',
      passwordHash: await bcrypt.hash('tester123', saltRounds),
    },
  });
  console.log('Created users: admin, developer, tester');

  await prisma.organizationMember.createMany({
    data: [
      { organizationId: org.id, userId: adminUser.id, role: 'ORG_ADMIN' },
      { organizationId: org.id, userId: devUser.id, role: 'MEMBER' },
      { organizationId: org.id, userId: testerUser.id, role: 'MEMBER' },
    ],
  });
  console.log('Added users to organization');

  const project = await prisma.project.create({
    data: {
      name: 'RemoteDesk',
      key: 'RD',
      description: 'Remote desktop management platform',
      organizationId: org.id,
      leadId: adminUser.id,
    },
  });
  console.log(`Created project: ${project.name} (${project.key})`);

  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: adminUser.id, role: 'PROJECT_ADMIN' },
      { projectId: project.id, userId: devUser.id, role: 'MEMBER' },
      { projectId: project.id, userId: testerUser.id, role: 'MEMBER' },
    ],
  });
  console.log('Added users to project');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
