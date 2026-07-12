import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

const url = new URL(databaseUrl.replace(/^mysql:/, 'http:'));
const connectionConfig = {
  host: url.hostname,
  port: url.port ? parseInt(url.port) : 3306,
  user: url.username || 'root',
  password: url.password || '',
  database: url.pathname.replace(/^\//, '')
};

const adapter = new PrismaMariaDb(connectionConfig);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting massive database seeding...');

  // 1. Clean existing database records
  await prisma.auditItem.deleteMany({});
  await prisma.auditCycle.deleteMany({});
  await prisma.maintenanceRequest.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.allocation.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.assetCategory.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  console.log('Existing database cleaned.');

  // 2. Hash password
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // 3. Create Users
  console.log('Creating users...');
  
  const admin = await prisma.user.create({ data: { name: 'Jane Smith', email: 'admin@assetflow.com', passwordHash: defaultPasswordHash, role: 'ADMIN' }});
  const manager = await prisma.user.create({ data: { name: 'John Doe', email: 'manager@assetflow.com', passwordHash: defaultPasswordHash, role: 'ASSET_MANAGER' }});
  
  const itHead = await prisma.user.create({ data: { name: 'Sarah Connor', email: 'sarah.connor@assetflow.com', passwordHash: defaultPasswordHash, role: 'DEPARTMENT_HEAD' }});
  const hrHead = await prisma.user.create({ data: { name: 'Michael Scott', email: 'michael.scott@assetflow.com', passwordHash: defaultPasswordHash, role: 'DEPARTMENT_HEAD' }});
  const opsHead = await prisma.user.create({ data: { name: 'Olivia Pope', email: 'olivia.pope@assetflow.com', passwordHash: defaultPasswordHash, role: 'DEPARTMENT_HEAD' }});
  const salesHead = await prisma.user.create({ data: { name: 'Don Draper', email: 'don.draper@assetflow.com', passwordHash: defaultPasswordHash, role: 'DEPARTMENT_HEAD' }});

  // Employees
  const employees = await Promise.all([
    prisma.user.create({ data: { name: 'Priya Patel', email: 'priya@assetflow.com', passwordHash: defaultPasswordHash, role: 'EMPLOYEE' }}),
    prisma.user.create({ data: { name: 'Raj Kumar', email: 'raj@assetflow.com', passwordHash: defaultPasswordHash, role: 'EMPLOYEE' }}),
    prisma.user.create({ data: { name: 'Bob Cooper', email: 'bob@assetflow.com', passwordHash: defaultPasswordHash, role: 'EMPLOYEE' }}),
    prisma.user.create({ data: { name: 'Alice Walker', email: 'alice@assetflow.com', passwordHash: defaultPasswordHash, role: 'EMPLOYEE' }}),
    prisma.user.create({ data: { name: 'Charlie Day', email: 'charlie@assetflow.com', passwordHash: defaultPasswordHash, role: 'EMPLOYEE' }}),
    prisma.user.create({ data: { name: 'Diana Prince', email: 'diana@assetflow.com', passwordHash: defaultPasswordHash, role: 'EMPLOYEE' }}),
    prisma.user.create({ data: { name: 'Evan Rachel Wood', email: 'evan@assetflow.com', passwordHash: defaultPasswordHash, role: 'EMPLOYEE' }}),
    prisma.user.create({ data: { name: 'Frank Castle', email: 'frank@assetflow.com', passwordHash: defaultPasswordHash, role: 'EMPLOYEE' }}),
    prisma.user.create({ data: { name: 'Gina Linetti', email: 'gina@assetflow.com', passwordHash: defaultPasswordHash, role: 'EMPLOYEE' }})
  ]);

  // 4. Create Departments
  console.log('Creating departments...');
  const itDept = await prisma.department.create({ data: { name: 'IT Department', headId: itHead.id }});
  const hrDept = await prisma.department.create({ data: { name: 'HR Department', headId: hrHead.id }});
  const opsDept = await prisma.department.create({ data: { name: 'Operations', headId: opsHead.id }});
  const salesDept = await prisma.department.create({ data: { name: 'Sales & Marketing', headId: salesHead.id }});

  // Assign employees to departments
  const assignToDept = async (userId: string, deptId: string) => {
    await prisma.user.update({ where: { id: userId }, data: { departmentId: deptId } });
  };
  await assignToDept(employees[0].id, itDept.id);
  await assignToDept(employees[1].id, itDept.id);
  await assignToDept(employees[2].id, hrDept.id);
  await assignToDept(employees[3].id, hrDept.id);
  await assignToDept(employees[4].id, opsDept.id);
  await assignToDept(employees[5].id, opsDept.id);
  await assignToDept(employees[6].id, salesDept.id);
  await assignToDept(employees[7].id, salesDept.id);
  await assignToDept(employees[8].id, salesDept.id);

  // 5. Create Asset Categories
  console.log('Creating asset categories...');
  const electronics = await prisma.assetCategory.create({ data: { name: 'Electronics', warrantyPeriod: 24 }});
  const furniture = await prisma.assetCategory.create({ data: { name: 'Furniture' }});
  const vehicles = await prisma.assetCategory.create({ data: { name: 'Vehicles', warrantyPeriod: 60 }});
  const network = await prisma.assetCategory.create({ data: { name: 'Networking Gear', warrantyPeriod: 12 }});

  // 6. Create Assets (A lot of them)
  console.log('Creating assets...');
  
  const assetSpecs = [
    // Electronics
    { tag: 'AF-101', name: 'MacBook Pro M3', cost: 2500, cat: electronics.id, dept: itDept.id, status: 'ALLOCATED' },
    { tag: 'AF-102', name: 'Dell XPS 15', cost: 1800, cat: electronics.id, dept: itDept.id, status: 'ALLOCATED' },
    { tag: 'AF-103', name: 'MacBook Air M2', cost: 1200, cat: electronics.id, dept: hrDept.id, status: 'ALLOCATED' },
    { tag: 'AF-104', name: 'ThinkPad T14', cost: 1400, cat: electronics.id, dept: opsDept.id, status: 'ALLOCATED' },
    { tag: 'AF-105', name: 'Surface Pro 9', cost: 1100, cat: electronics.id, dept: salesDept.id, status: 'AVAILABLE' },
    { tag: 'AF-106', name: 'iPad Pro 12.9"', cost: 1000, cat: electronics.id, dept: salesDept.id, status: 'UNDER_MAINTENANCE' },
    { tag: 'AF-107', name: '4K Monitor Dell U2723QE', cost: 600, cat: electronics.id, dept: itDept.id, status: 'ALLOCATED' },
    { tag: 'AF-108', name: '4K Monitor LG 27UK850', cost: 500, cat: electronics.id, dept: itDept.id, status: 'ALLOCATED' },
    { tag: 'AF-109', name: 'Logitech MX Master 3', cost: 100, cat: electronics.id, dept: itDept.id, status: 'AVAILABLE' },
    { tag: 'AF-110', name: 'Conference Projector 4K', cost: 3500, cat: electronics.id, dept: null, status: 'AVAILABLE', shared: true },
    { tag: 'AF-111', name: 'Meeting Room Audio System', cost: 1200, cat: electronics.id, dept: null, status: 'AVAILABLE', shared: true },

    // Furniture
    { tag: 'AF-201', name: 'ErgoChair Pro', cost: 500, cat: furniture.id, dept: hrDept.id, status: 'ALLOCATED' },
    { tag: 'AF-202', name: 'ErgoChair Pro', cost: 500, cat: furniture.id, dept: itDept.id, status: 'ALLOCATED' },
    { tag: 'AF-203', name: 'Herman Miller Aeron', cost: 1200, cat: furniture.id, dept: opsDept.id, status: 'ALLOCATED' },
    { tag: 'AF-204', name: 'Steelcase Leap', cost: 900, cat: furniture.id, dept: salesDept.id, status: 'AVAILABLE' },
    { tag: 'AF-205', name: 'Standing Desk L-Shape', cost: 800, cat: furniture.id, dept: itDept.id, status: 'ALLOCATED' },
    { tag: 'AF-206', name: 'Meeting Table 12-Seat', cost: 2500, cat: furniture.id, dept: null, status: 'AVAILABLE', shared: true },
    { tag: 'AF-207', name: 'Lounge Sofa', cost: 1500, cat: furniture.id, dept: hrDept.id, status: 'AVAILABLE' },
    { tag: 'AF-208', name: 'Whiteboard Mobile', cost: 200, cat: furniture.id, dept: null, status: 'UNDER_MAINTENANCE' },

    // Vehicles
    { tag: 'AF-301', name: 'Toyota Prius (Company Pool)', cost: 25000, cat: vehicles.id, dept: null, status: 'AVAILABLE', shared: true },
    { tag: 'AF-302', name: 'Ford Transit Van', cost: 38000, cat: vehicles.id, dept: opsDept.id, status: 'ALLOCATED' },
    { tag: 'AF-303', name: 'Chevy Bolt EV', cost: 32000, cat: vehicles.id, dept: salesDept.id, status: 'AVAILABLE', shared: true },
    { tag: 'AF-304', name: 'Executive Sedan', cost: 45000, cat: vehicles.id, dept: null, status: 'UNDER_MAINTENANCE' },

    // Networking Gear
    { tag: 'AF-401', name: 'Cisco Core Switch', cost: 8000, cat: network.id, dept: itDept.id, status: 'ALLOCATED' },
    { tag: 'AF-402', name: 'Meraki AP MX68', cost: 1200, cat: network.id, dept: itDept.id, status: 'AVAILABLE' },
    { tag: 'AF-403', name: 'Palo Alto Firewall', cost: 15000, cat: network.id, dept: itDept.id, status: 'ALLOCATED' },
  ];

  const dbAssets = [];
  for (const spec of assetSpecs) {
    // Generate dates spread across last 3 years
    const acquisitionDate = new Date();
    acquisitionDate.setDate(acquisitionDate.getDate() - Math.floor(Math.random() * 1000));
    
    const asset = await prisma.asset.create({
      data: {
        assetTag: spec.tag,
        name: spec.name,
        acquisitionDate,
        acquisitionCost: spec.cost,
        condition: 'Good',
        location: 'HQ Main Building',
        isSharedBookable: spec.shared || false,
        status: spec.status as any,
        categoryId: spec.cat,
        departmentId: spec.dept,
      }
    });
    dbAssets.push(asset);
  }

  console.log('Assets created.');

  // 7. Create Allocations (Active and Historical)
  console.log('Creating allocations...');
  
  // Create some active allocations mapped to the statuses above
  const findAsset = (tag: string) => dbAssets.find(a => a.assetTag === tag);
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 5); // Overdue

  await prisma.allocation.create({ data: { assetId: findAsset('AF-101')!.id, userId: employees[0].id, expectedReturnDate: futureDate, status: 'APPROVED' } });
  await prisma.allocation.create({ data: { assetId: findAsset('AF-102')!.id, userId: employees[1].id, expectedReturnDate: futureDate, status: 'APPROVED' } });
  await prisma.allocation.create({ data: { assetId: findAsset('AF-103')!.id, userId: employees[2].id, expectedReturnDate: pastDate, status: 'APPROVED' } }); // Overdue
  await prisma.allocation.create({ data: { assetId: findAsset('AF-104')!.id, userId: employees[4].id, expectedReturnDate: futureDate, status: 'APPROVED' } });
  
  await prisma.allocation.create({ data: { assetId: findAsset('AF-201')!.id, userId: employees[2].id, expectedReturnDate: futureDate, status: 'APPROVED' } });
  await prisma.allocation.create({ data: { assetId: findAsset('AF-202')!.id, userId: employees[1].id, expectedReturnDate: futureDate, status: 'APPROVED' } });
  await prisma.allocation.create({ data: { assetId: findAsset('AF-203')!.id, userId: employees[4].id, expectedReturnDate: futureDate, status: 'APPROVED' } });
  
  await prisma.allocation.create({ data: { assetId: findAsset('AF-302')!.id, departmentId: opsDept.id, expectedReturnDate: futureDate, status: 'APPROVED' } });
  await prisma.allocation.create({ data: { assetId: findAsset('AF-401')!.id, departmentId: itDept.id, expectedReturnDate: futureDate, status: 'APPROVED' } });
  await prisma.allocation.create({ data: { assetId: findAsset('AF-403')!.id, departmentId: itDept.id, expectedReturnDate: futureDate, status: 'APPROVED' } });

  // Some returned historical allocations
  const returnedDate = new Date();
  returnedDate.setDate(returnedDate.getDate() - 10);
  await prisma.allocation.create({ data: { assetId: findAsset('AF-109')!.id, userId: employees[0].id, expectedReturnDate: returnedDate, actualReturnDate: returnedDate, status: 'RETURNED', conditionCheckIn: 'Good' } });
  await prisma.allocation.create({ data: { assetId: findAsset('AF-105')!.id, userId: employees[6].id, expectedReturnDate: returnedDate, actualReturnDate: returnedDate, status: 'RETURNED', conditionCheckIn: 'Slight scratches' } });

  // 8. Create Bookings
  console.log('Creating bookings...');
  const today = new Date();
  
  // Historical Bookings
  for (let i = 1; i <= 30; i++) {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i, 10, 0);
    const end = new Date(start.getTime() + (2 * 60 * 60 * 1000));
    
    await prisma.booking.create({
      data: {
        assetId: findAsset(i % 2 === 0 ? 'AF-206' : 'AF-110')!.id,
        userId: employees[i % employees.length].id,
        startTime: start,
        endTime: end,
        status: 'COMPLETED',
      }
    });
  }

  // Active/Upcoming Bookings
  const tmrw = new Date();
  tmrw.setDate(tmrw.getDate() + 1);
  await prisma.booking.create({ data: { assetId: findAsset('AF-301')!.id, userId: employees[8].id, startTime: tmrw, endTime: new Date(tmrw.getTime() + 8*60*60*1000), status: 'UPCOMING' }});
  await prisma.booking.create({ data: { assetId: findAsset('AF-206')!.id, userId: employees[7].id, startTime: tmrw, endTime: new Date(tmrw.getTime() + 2*60*60*1000), status: 'UPCOMING' }});
  await prisma.booking.create({ data: { assetId: findAsset('AF-303')!.id, userId: employees[5].id, startTime: new Date(), endTime: new Date(new Date().getTime() + 4*60*60*1000), status: 'ONGOING' }});

  // 9. Create Maintenance Requests
  console.log('Creating maintenance requests...');
  
  await prisma.maintenanceRequest.create({ data: { assetId: findAsset('AF-106')!.id, requesterId: employees[6].id, issue: 'Screen glitching', priority: 'HIGH', status: 'IN_PROGRESS' } });
  await prisma.maintenanceRequest.create({ data: { assetId: findAsset('AF-208')!.id, requesterId: employees[2].id, issue: 'Wheels broken', priority: 'LOW', status: 'PENDING' } });
  await prisma.maintenanceRequest.create({ data: { assetId: findAsset('AF-304')!.id, requesterId: opsHead.id, issue: 'Engine check light on', priority: 'HIGH', status: 'IN_PROGRESS' } });
  
  // Resolved tickets
  await prisma.maintenanceRequest.create({ data: { assetId: findAsset('AF-101')!.id, requesterId: employees[0].id, issue: 'Keyboard keys stuck', priority: 'MEDIUM', status: 'RESOLVED' } });
  await prisma.maintenanceRequest.create({ data: { assetId: findAsset('AF-301')!.id, requesterId: employees[4].id, issue: 'Routine oil change', priority: 'LOW', status: 'RESOLVED' } });

  console.log('Massive Database seeding successfully completed.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
