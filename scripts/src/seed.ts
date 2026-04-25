import bcrypt from "bcryptjs";
import { db, usersTable, incidentsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const PASSWORD_HASH = await bcrypt.hash("password123", 10);

async function main() {
  const [{ count: userCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable);

  if (Number(userCount) > 0) {
    console.log("Users already exist. Skipping seed.");
    return;
  }

  const users = await db
    .insert(usersTable)
    .values([
      {
        email: "admin@factory.local",
        passwordHash: PASSWORD_HASH,
        fullName: "Adaeze Okafor",
        role: "admin",
      },
      {
        email: "supervisor@factory.local",
        passwordHash: PASSWORD_HASH,
        fullName: "Marcus Lindqvist",
        role: "supervisor",
      },
      {
        email: "operator@factory.local",
        passwordHash: PASSWORD_HASH,
        fullName: "Priya Raman",
        role: "operator",
      },
    ])
    .returning();

  const adminId = users[0].id;
  const supervisorId = users[1].id;
  const operatorId = users[2].id;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const samples: Array<{
    code: string;
    daysAgo: number;
    department: string;
    line: string;
    productType: string;
    category: string;
    severity: string;
    description: string;
    immediateAction: string;
    status: string;
    rootCauseCategory: string | null;
    reportedById: number;
  }> = [
    {
      code: "INC-2026-00001",
      daysAgo: 0,
      department: "Production",
      line: "Line 2",
      productType: "Beverage 500ml",
      category: "Underweight",
      severity: "High",
      description:
        "Sample of 12 units showed 487g average vs 500g target. Filler nozzle 3 appears partially blocked.",
      immediateAction:
        "Stopped Line 2, isolated affected pallet, scheduled cleaning of nozzle 3.",
      status: "In Progress",
      rootCauseCategory: "Equipment",
      reportedById: operatorId,
    },
    {
      code: "INC-2026-00002",
      daysAgo: 1,
      department: "Quality",
      line: "Packaging Hall A",
      productType: "Snack Pack 150g",
      category: "Packaging Defect",
      severity: "Medium",
      description:
        "Seal integrity failure on roughly 4% of pouches in lot QPA-9821. Heat seal bar temperature reading drifting.",
      immediateAction:
        "Quarantined lot, increased seal-strength sampling to every 30 minutes.",
      status: "Open",
      rootCauseCategory: "Process",
      reportedById: supervisorId,
    },
    {
      code: "INC-2026-00003",
      daysAgo: 2,
      department: "HSE",
      line: "Receiving Bay",
      productType: "Bulk Powder 25kg",
      category: "Contamination",
      severity: "Critical",
      description:
        "Pallet of incoming raw material had visible rodent activity on outer wrap. Inner sacks intact but suspect.",
      immediateAction:
        "Isolated pallet, blocked from production, supplier non-conformance opened, pest control notified.",
      status: "Open",
      rootCauseCategory: "Materials",
      reportedById: supervisorId,
    },
    {
      code: "INC-2026-00004",
      daysAgo: 3,
      department: "Engineering",
      line: "Line 1",
      productType: "Beverage 1L",
      category: "Equipment Failure",
      severity: "High",
      description:
        "Capper torque sensor offline for 22 minutes. Some units may have understorqued caps.",
      immediateAction:
        "Sensor replaced. 14 minutes of production held for torque retest.",
      status: "Closed",
      rootCauseCategory: "Equipment",
      reportedById: adminId,
    },
    {
      code: "INC-2026-00005",
      daysAgo: 5,
      department: "Production",
      line: "Line 3",
      productType: "Cereal Box 500g",
      category: "Process Deviation",
      severity: "Low",
      description:
        "Coding station printed previous lot code on 8 boxes during changeover.",
      immediateAction: "Affected boxes destroyed. Changeover SOP review scheduled.",
      status: "Closed",
      rootCauseCategory: "People",
      reportedById: operatorId,
    },
    {
      code: "INC-2026-00006",
      daysAgo: 7,
      department: "Warehouse",
      line: "Cold Storage",
      productType: "Sauce Jar 250g",
      category: "Process Deviation",
      severity: "Medium",
      description:
        "Cold storage temperature spiked to 9.2C for 38 minutes overnight per logger trace.",
      immediateAction:
        "Affected stock placed on hold pending sensory and microbiological release tests.",
      status: "In Progress",
      rootCauseCategory: "Environment",
      reportedById: supervisorId,
    },
    {
      code: "INC-2026-00007",
      daysAgo: 10,
      department: "Quality",
      line: "Line 4",
      productType: "Snack Pack 50g",
      category: "Underweight",
      severity: "Low",
      description:
        "Trend in last 4 hours shows fill drifting toward lower spec limit. Still in spec.",
      immediateAction: "Scale recalibrated. Operator briefed.",
      status: "Closed",
      rootCauseCategory: "Measurement",
      reportedById: operatorId,
    },
    {
      code: "INC-2026-00008",
      daysAgo: 14,
      department: "Production",
      line: "Line 2",
      productType: "Beverage 500ml",
      category: "Equipment Failure",
      severity: "Critical",
      description:
        "Conveyor drive motor seized. Production stopped for 1h 47min on shift B.",
      immediateAction:
        "Motor swapped. Maintenance reviewing PM frequency for Line 2 drives.",
      status: "Closed",
      rootCauseCategory: "Equipment",
      reportedById: adminId,
    },
    {
      code: "INC-2026-00009",
      daysAgo: 18,
      department: "HSE",
      line: "Packaging Hall B",
      productType: "Snack Pack 150g",
      category: "Others",
      severity: "Low",
      description:
        "Minor oil spill near case packer 2. No injuries, no product impact.",
      immediateAction: "Spill kit deployed and area cleaned. JSA refreshed for shift.",
      status: "Closed",
      rootCauseCategory: "Process",
      reportedById: supervisorId,
    },
    {
      code: "INC-2026-00010",
      daysAgo: 22,
      department: "Quality",
      line: "Line 1",
      productType: "Beverage 1L",
      category: "Contamination",
      severity: "High",
      description:
        "Foreign material (small plastic shards) found in 3 retain samples from lot L1-7714.",
      immediateAction:
        "Lot held. Filler disassembled and inspected. Rework and re-screen scheduled.",
      status: "In Progress",
      rootCauseCategory: "Equipment",
      reportedById: supervisorId,
    },
  ];

  await db.insert(incidentsTable).values(
    samples.map((s) => ({
      incidentCode: s.code,
      occurredAt: new Date(now - s.daysAgo * day),
      department: s.department,
      line: s.line,
      productType: s.productType,
      category: s.category,
      severity: s.severity,
      description: s.description,
      immediateAction: s.immediateAction,
      status: s.status,
      attachmentUrl: null,
      rootCauseCategory: s.rootCauseCategory,
      reportedById: s.reportedById,
    })),
  );

  console.log(
    `Seeded ${users.length} users and ${samples.length} incidents.\n` +
      "Login credentials (password: password123):\n" +
      "  admin@factory.local\n" +
      "  supervisor@factory.local\n" +
      "  operator@factory.local",
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
