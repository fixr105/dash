import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Remove legacy bootstrap data from earlier setup to keep the requested baseline deterministic.
  const legacyNbfc = await prisma.nbfc.findUnique({
    where: { slug: "seven-fincorp" },
    select: { id: true }
  });

  if (legacyNbfc) {
    await prisma.userMembership.deleteMany({ where: { nbfcId: legacyNbfc.id } });
    await prisma.event.deleteMany({ where: { nbfcId: legacyNbfc.id } });
    await prisma.nbfc.delete({ where: { id: legacyNbfc.id } });
  }

  await prisma.userMembership.deleteMany({
    where: { scope: "" }
  });

  const passwordHash = await bcrypt.hash("changeme123", 10);

  const rahulUser = await prisma.user.upsert({
    where: { email: "rahul@sevenfincorp.com" },
    update: {
      name: "Rahul Gonsalves",
      passwordHash
    },
    create: {
      email: "rahul@sevenfincorp.com",
      name: "Rahul Gonsalves",
      passwordHash
    }
  });

  const underwriterUser = await prisma.user.upsert({
    where: { email: "underwriter@testnbfc.com" },
    update: {
      name: "Test Underwriter",
      passwordHash
    },
    create: {
      email: "underwriter@testnbfc.com",
      name: "Test Underwriter",
      passwordHash
    }
  });

  const nbfc = await prisma.nbfc.upsert({
    where: { slug: "test-nbfc" },
    update: {
      legalEntityName: "Test NBFC Private Limited",
      status: "ACTIVE",
      slug: "test-nbfc"
    },
    create: {
      name: "Test NBFC",
      legalEntityName: "Test NBFC Private Limited",
      status: "ACTIVE",
      slug: "test-nbfc"
    }
  });

  await prisma.userMembership.upsert({
    where: {
      userId_scope: {
        userId: rahulUser.id,
        scope: "platform:dash"
      }
    },
    update: {
      role: "admin",
      nbfcId: null
    },
    create: {
      userId: rahulUser.id,
      scope: "platform:dash",
      role: "admin"
    }
  });

  await prisma.userMembership.upsert({
    where: {
      userId_scope: {
        userId: underwriterUser.id,
        scope: `nbfc:${nbfc.id}`
      }
    },
    update: {
      role: "underwriter",
      nbfcId: nbfc.id
    },
    create: {
      userId: underwriterUser.id,
      nbfcId: nbfc.id,
      scope: `nbfc:${nbfc.id}`,
      role: "underwriter"
    }
  });

  const loanApplications = [
    { externalRef: "SF-APP-000001", amount: 500000 },
    { externalRef: "SF-APP-000002", amount: 1200000 },
    { externalRef: "SF-APP-000003", amount: 350000 }
  ];

  for (const loanApplication of loanApplications) {
    await prisma.loanApplication.upsert({
      where: { externalRef: loanApplication.externalRef },
      update: {
        productModuleKey: "MM",
        status: "SENT_TO_NBFC",
        assignedNbfcId: nbfc.id,
        assignedAt: new Date(),
        amount: loanApplication.amount,
        applicantUserId: rahulUser.id,
        nbfcId: nbfc.id
      },
      create: {
        externalRef: loanApplication.externalRef,
        productModuleKey: "MM",
        status: "SENT_TO_NBFC",
        assignedNbfcId: nbfc.id,
        assignedAt: new Date(),
        amount: loanApplication.amount,
        applicantUserId: rahulUser.id,
        nbfcId: nbfc.id
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
