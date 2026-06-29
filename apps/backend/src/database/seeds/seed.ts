/**
 * Database seed — idempotent.
 *
 * Re-running must not duplicate rows: categories upsert by slug, users by email,
 * products by name. Seeds the Maison catalog so the storefront renders the exact
 * data the design shows — real product imagery, sale prices, ratings, colours and
 * sizes — with the design's eight signature products created last so they surface
 * first under the "newest" sort on the home page.
 *
 * Run: `npm run seed` (from repo root or apps/backend).
 */
import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Product } from '../../products/entities/product.entity';
import { Cart } from '../../cart/entities/cart.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';
import { Order, OrderStatus } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import type { ProductColor } from '@ecommerce/shared-types';

loadEnv();

/** Build a stable Unsplash delivery URL the same way the design does. */
const img = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const COLOR: Record<string, string> = {
  Sand: '#C9B49A',
  Espresso: '#2C2620',
  Cognac: '#8A5A3B',
  'Off White': '#F2EFE9',
  Black: '#1F1F1F',
  Sky: '#A9B5C9',
  'Tan Leather': '#8A5A3B',
  Onyx: '#1F1F1F',
  Camel: '#C9B49A',
  Noir: '#1F1F1F',
  Tortoise: '#5B3A29',
  Honey: '#C9B49A',
  Sage: '#6B6E64',
  Charcoal: '#2C2620',
  Rust: '#A23B2D',
  Stone: '#6B6E64',
  Truffle: '#2C2620',
  Natural: '#C9B49A',
  Tobacco: '#8A5A3B',
  Azure: '#A9B5C9',
  Ivory: '#F2EFE9',
  Wheat: '#C9B49A',
  Gold: '#C8A248',
  Silver: '#C9CCD1',
  Rose: '#C98A86',
};

const colors = (...names: string[]): ProductColor[] =>
  names.map((name) => ({ name, hex: COLOR[name] ?? '#C9B49A' }));

interface CategorySeed {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

// Wider crop for the full-bleed collection cards.
const catImg = (id: string) => img(id, 1200);

const CATEGORIES: CategorySeed[] = [
  { name: 'Bags', slug: 'bags', description: 'Structured totes, crossbodies and weekenders made to carry a lifetime.', imageUrl: catImg('1548036328-c9fa89d128fa') },
  { name: 'Shoes', slug: 'shoes', description: 'Court sneakers, suede lows and everyday leather, built for the long walk home.', imageUrl: catImg('1542291026-7eec264c27ff') },
  { name: 'Watches', slug: 'watches', description: 'Automatic chronographs and minimalist dials, quietly confident on the wrist.', imageUrl: catImg('1523275335684-37898b6baf30') },
  { name: 'Eyewear', slug: 'eyewear', description: 'Hand-polished acetate frames with polarised, UV-400 lenses.', imageUrl: catImg('1577803645773-f96470509666') },
  { name: 'Apparel', slug: 'apparel', description: 'Responsibly sourced knits, blouses and essentials made to last.', imageUrl: catImg('1521572163474-6864f9cf17ab') },
  { name: 'Hats', slug: 'hats', description: 'Packable fedoras and woven brims that shape back instantly.', imageUrl: catImg('1534215754734-18e55d13e346') },
  { name: 'Jewelry', slug: 'jewelry', description: 'Considered pieces in solid metals and natural stones.', imageUrl: catImg('1611591437281-460bfbe1220a') },
  { name: 'Fragrance', slug: 'fragrance', description: 'Slow-blended scents in refillable apothecary glass.', imageUrl: catImg('1541643600914-78b084683601') },
];

interface ProductSeed {
  name: string;
  categorySlug: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  stockQuantity: number;
  image: string;
  description: string;
  colors: ProductColor[];
  sizes: string[];
}

/** The eight signature products from the design — created last so they read as newest. */
const DESIGN_PRODUCTS: ProductSeed[] = [
  {
    name: 'Aria Leather Tote', categorySlug: 'bags', price: 320, compareAtPrice: 380, rating: 4.9, reviewCount: 128, stockQuantity: 24,
    image: img('1584917865442-de89df76afd3'),
    description: 'A structured everyday tote in full-grain Italian leather, finished by hand with reinforced straps and a suede-lined interior built to carry your world in quiet luxury.',
    colors: colors('Sand', 'Espresso', 'Cognac'), sizes: ['One Size'],
  },
  {
    name: 'Cloud Court Sneakers', categorySlug: 'shoes', price: 145, rating: 4.7, reviewCount: 212, stockQuantity: 40,
    image: img('1549298916-b41d501d3772'),
    description: 'Minimal low-top sneakers on a cushioned cloud sole. Premium tumbled leather upper that softens beautifully with every wear — pure understated comfort.',
    colors: colors('Off White', 'Black', 'Sky'), sizes: ['EU 38', 'EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43'],
  },
  {
    name: 'Heritage Chrono Watch', categorySlug: 'watches', price: 280, compareAtPrice: 340, rating: 4.8, reviewCount: 96, stockQuantity: 15,
    image: img('1524592094714-0f0654e20314'),
    description: 'A timeless automatic chronograph with a sapphire crystal face and supple leather strap. Swiss movement, water-resistant, and quietly confident on the wrist.',
    colors: colors('Tan Leather', 'Onyx', 'Camel'), sizes: ['38mm', '42mm'],
  },
  {
    name: 'Noir Acetate Shades', categorySlug: 'eyewear', price: 95, rating: 4.6, reviewCount: 74, stockQuantity: 60,
    image: img('1572635196237-14b3f281503f'),
    description: 'Hand-polished acetate frames with polarised, UV-400 lenses. A sculptural silhouette that flatters every face — sunlit days, effortlessly elevated.',
    colors: colors('Noir', 'Tortoise', 'Honey'), sizes: ['One Size'],
  },
  {
    name: 'Camel Wool Knit', categorySlug: 'apparel', price: 120, compareAtPrice: 150, rating: 4.9, reviewCount: 154, stockQuantity: 35,
    image: img('1576566588028-4147f3842f27'),
    description: 'A relaxed crewneck spun from responsibly sourced merino wool. Breathable, pill-resistant, and impossibly soft — your new cold-weather essential.',
    colors: colors('Camel', 'Sage', 'Charcoal', 'Rust'), sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    name: 'Sand Suede Lows', categorySlug: 'shoes', price: 160, rating: 4.7, reviewCount: 88, stockQuantity: 28,
    image: img('1595950653106-6c9ebd614d3a'),
    description: 'Buttery suede low-tops with a hand-stitched welt and natural gum sole. Crafted for the long walk home and every detour along the way.',
    colors: colors('Sand', 'Stone', 'Truffle'), sizes: ['EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43'],
  },
  {
    name: 'Linen Fedora', categorySlug: 'hats', price: 84, rating: 4.5, reviewCount: 61, stockQuantity: 50,
    image: img('1521369909029-2afed882baee'),
    description: 'A packable wide-brim fedora woven from breathable linen straw. Shapes back instantly and shades you in style from coast to city.',
    colors: colors('Natural', 'Black', 'Tobacco'), sizes: ['S/M', 'L/XL'],
  },
  {
    name: 'Azure Cotton Blouse', categorySlug: 'apparel', price: 140, rating: 4.8, reviewCount: 103, stockQuantity: 32,
    image: img('1564584217132-2271feaeb3c5'),
    description: 'An airy embroidered blouse in organic cotton with delicate hand-finished detailing. Light as a breeze, endlessly easy to wear.',
    colors: colors('Azure', 'Ivory', 'Wheat'), sizes: ['XS', 'S', 'M', 'L'],
  },
];

/** Additional catalog depth so the shop, filters and pagination have substance. */
const EXTRA_PRODUCTS: ProductSeed[] = [
  // Bags
  { name: 'Marlow Crossbody', categorySlug: 'bags', price: 210, rating: 4.6, reviewCount: 64, stockQuantity: 30, image: img('1548036328-c9fa89d128fa'), description: 'A compact crossbody in pebbled leather with an adjustable webbing strap — hands-free and quietly elegant.', colors: colors('Espresso', 'Sand'), sizes: ['One Size'] },
  { name: 'Atlas Weekender', categorySlug: 'bags', price: 295, compareAtPrice: 340, rating: 4.7, reviewCount: 51, stockQuantity: 18, image: img('1547949003-9792a18a2601'), description: 'A roomy two-day holdall in waxed canvas and leather trim, built for the spontaneous escape.', colors: colors('Cognac', 'Black'), sizes: ['One Size'] },
  { name: 'Lune Bucket Bag', categorySlug: 'bags', price: 175, rating: 4.5, reviewCount: 39, stockQuantity: 26, image: img('1559563458-527698bf5295'), description: 'A softly slouched bucket bag with a drawstring close and suede lining.', colors: colors('Sand', 'Espresso'), sizes: ['One Size'] },
  { name: 'Carter Card Holder', categorySlug: 'bags', price: 65, rating: 4.4, reviewCount: 88, stockQuantity: 80, image: img('1627123424574-724758594e93'), description: 'A slim full-grain card holder that wears in beautifully over the years.', colors: colors('Cognac', 'Onyx'), sizes: ['One Size'] },
  // Shoes
  { name: 'Rivet Chelsea Boots', categorySlug: 'shoes', price: 230, compareAtPrice: 275, rating: 4.8, reviewCount: 77, stockQuantity: 22, image: img('1542291026-7eec264c27ff'), description: 'Hand-lasted Chelsea boots in oiled leather with elastic gussets and a stacked heel.', colors: colors('Espresso', 'Black'), sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'] },
  { name: 'Trail Runner Pro', categorySlug: 'shoes', price: 135, rating: 4.5, reviewCount: 142, stockQuantity: 44, image: img('1460353581641-37baddab0fa2'), description: 'A lightweight everyday runner with a breathable knit upper and responsive foam midsole.', colors: colors('Stone', 'Sky'), sizes: ['EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43'] },
  { name: 'Demi Leather Loafers', categorySlug: 'shoes', price: 185, rating: 4.6, reviewCount: 58, stockQuantity: 27, image: img('1614252369475-531eba835eb1'), description: 'Classic penny loafers in polished calf leather with a leather sole.', colors: colors('Cognac', 'Onyx'), sizes: ['EU 38', 'EU 39', 'EU 40', 'EU 41'] },
  // Watches
  { name: 'Lumen Field Watch', categorySlug: 'watches', price: 165, rating: 4.6, reviewCount: 73, stockQuantity: 33, image: img('1523275335684-37898b6baf30'), description: 'A rugged field watch with luminous markers, a domed crystal and a quick-release strap.', colors: colors('Onyx', 'Camel'), sizes: ['40mm'] },
  { name: 'Solène Dress Watch', categorySlug: 'watches', price: 240, compareAtPrice: 290, rating: 4.7, reviewCount: 49, stockQuantity: 19, image: img('1547996160-81dfa63595aa'), description: 'A slim dress watch with a sunburst dial and a Milanese mesh bracelet.', colors: colors('Silver', 'Gold'), sizes: ['36mm', '40mm'] },
  { name: 'Orbit Automatic', categorySlug: 'watches', price: 320, rating: 4.9, reviewCount: 38, stockQuantity: 12, image: img('1612817159949-195b6eb9e31a'), description: 'An open-heart automatic with an exhibition caseback and an integrated steel bracelet.', colors: colors('Onyx', 'Silver'), sizes: ['41mm'] },
  // Eyewear
  { name: 'Halcyon Round Frames', categorySlug: 'eyewear', price: 110, rating: 4.5, reviewCount: 62, stockQuantity: 48, image: img('1511499767150-a48a237f0083'), description: 'Featherweight round frames in honey acetate with anti-glare lenses.', colors: colors('Honey', 'Tortoise'), sizes: ['One Size'] },
  { name: 'Vega Aviators', categorySlug: 'eyewear', price: 125, compareAtPrice: 150, rating: 4.6, reviewCount: 91, stockQuantity: 41, image: img('1577803645773-f96470509666'), description: 'Classic teardrop aviators with a lightweight metal frame and gradient lenses.', colors: colors('Gold', 'Noir'), sizes: ['One Size'] },
  { name: 'Sable Reading Glasses', categorySlug: 'eyewear', price: 78, rating: 4.4, reviewCount: 44, stockQuantity: 55, image: img('1574258495973-f010dfbb5371'), description: 'Slim rectangular readers with spring hinges and a matte finish.', colors: colors('Noir', 'Tortoise'), sizes: ['One Size'] },
  // Apparel
  { name: 'Oslo Linen Shirt', categorySlug: 'apparel', price: 98, rating: 4.6, reviewCount: 119, stockQuantity: 46, image: img('1521572163474-6864f9cf17ab'), description: 'A breezy garment-dyed linen shirt with a relaxed camp collar.', colors: colors('Ivory', 'Sage'), sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { name: 'Verona Wool Coat', categorySlug: 'apparel', price: 320, compareAtPrice: 395, rating: 4.8, reviewCount: 67, stockQuantity: 17, image: img('1539533018447-63fcce2678e3'), description: 'A double-faced wool overcoat with a clean drape and horn buttons.', colors: colors('Camel', 'Charcoal'), sizes: ['S', 'M', 'L', 'XL'] },
  { name: 'Pace Everyday Tee', categorySlug: 'apparel', price: 42, rating: 4.5, reviewCount: 203, stockQuantity: 90, image: img('1503341504253-dff4815485f1'), description: 'A heavyweight organic cotton tee with a clean neckline that holds its shape.', colors: colors('Ivory', 'Black', 'Sage'), sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  // Hats
  { name: 'Brisa Straw Boater', categorySlug: 'hats', price: 72, rating: 4.4, reviewCount: 33, stockQuantity: 38, image: img('1534215754734-18e55d13e346'), description: 'A flat-brim straw boater with a grosgrain band for sun-soaked afternoons.', colors: colors('Natural', 'Black'), sizes: ['S/M', 'L/XL'] },
  { name: 'Ridge Wool Beanie', categorySlug: 'hats', price: 38, rating: 4.6, reviewCount: 128, stockQuantity: 75, image: img('1576871337622-98d48d1cf531'), description: 'A ribbed merino beanie that stays soft wash after wash.', colors: colors('Charcoal', 'Camel', 'Rust'), sizes: ['One Size'] },
  { name: 'Cove Bucket Hat', categorySlug: 'hats', price: 54, compareAtPrice: 68, rating: 4.3, reviewCount: 47, stockQuantity: 52, image: img('1556306535-0f09a537f0a3'), description: 'A reversible cotton-twill bucket hat with a packable brim.', colors: colors('Sage', 'Sand'), sizes: ['S/M', 'L/XL'] },
  // Jewelry
  { name: 'Filo Signet Ring', categorySlug: 'jewelry', price: 130, rating: 4.7, reviewCount: 54, stockQuantity: 29, image: img('1605100804763-247f67b3557e'), description: 'A solid brass signet ring with a brushed face, ready to be engraved.', colors: colors('Gold', 'Silver'), sizes: ['6', '7', '8', '9'] },
  { name: 'Aurea Hoop Earrings', categorySlug: 'jewelry', price: 88, compareAtPrice: 110, rating: 4.8, reviewCount: 96, stockQuantity: 43, image: img('1611591437281-460bfbe1220a'), description: 'Lightweight gold-vermeil hoops with a secure latch — an everyday staple.', colors: colors('Gold', 'Silver'), sizes: ['One Size'] },
  { name: 'Petra Stone Pendant', categorySlug: 'jewelry', price: 145, rating: 4.6, reviewCount: 31, stockQuantity: 21, image: img('1599643478518-a784e5dc4c8f'), description: 'A natural stone pendant on a fine cable chain, each piece subtly unique.', colors: colors('Rose', 'Silver'), sizes: ['One Size'] },
  // Fragrance
  { name: 'Ember & Oud', categorySlug: 'fragrance', price: 115, rating: 4.8, reviewCount: 142, stockQuantity: 36, image: img('1541643600914-78b084683601'), description: 'A warm amber-and-oud eau de parfum that settles into the skin over hours.', colors: colors('Espresso'), sizes: ['50ml', '100ml'] },
  { name: 'Linen Bloom', categorySlug: 'fragrance', price: 98, compareAtPrice: 120, rating: 4.6, reviewCount: 88, stockQuantity: 40, image: img('1592945403244-b3fbafd7f539'), description: 'A clean white-floral scent with notes of fig leaf and sun-dried cotton.', colors: colors('Ivory'), sizes: ['50ml', '100ml'] },
  { name: 'Cedar Atelier', categorySlug: 'fragrance', price: 105, rating: 4.7, reviewCount: 57, stockQuantity: 33, image: img('1587017539504-67cfbddac569'), description: 'A dry cedar-and-vetiver blend in a refillable apothecary bottle.', colors: colors('Sage'), sizes: ['50ml', '100ml'] },
];

const ALL_PRODUCTS = [...EXTRA_PRODUCTS, ...DESIGN_PRODUCTS]; // design products last → newest

/** Extra customers so the dashboard customer count and order names read like a real shop. */
interface CustomerSeed {
  email: string;
  firstName: string;
  lastName: string;
  city: string;
  state: string;
}
const CUSTOMERS: CustomerSeed[] = [
  { email: 'amelia.carter@example.com', firstName: 'Amelia', lastName: 'Carter', city: 'London', state: 'ENG' },
  { email: 'noah.bennett@example.com', firstName: 'Noah', lastName: 'Bennett', city: 'Manchester', state: 'ENG' },
  { email: 'sofia.reyes@example.com', firstName: 'Sofia', lastName: 'Reyes', city: 'Bristol', state: 'ENG' },
  { email: 'liam.walsh@example.com', firstName: 'Liam', lastName: 'Walsh', city: 'Leeds', state: 'ENG' },
  { email: 'olivia.chen@example.com', firstName: 'Olivia', lastName: 'Chen', city: 'Edinburgh', state: 'SCT' },
  { email: 'ethan.brooks@example.com', firstName: 'Ethan', lastName: 'Brooks', city: 'Cardiff', state: 'WLS' },
  { email: 'mia.lindqvist@example.com', firstName: 'Mia', lastName: 'Lindqvist', city: 'Glasgow', state: 'SCT' },
  { email: 'lucas.moreau@example.com', firstName: 'Lucas', lastName: 'Moreau', city: 'Liverpool', state: 'ENG' },
];

/** How many orders the seed generates on a fresh database. */
const ORDER_COUNT = 42;
const TAX_RATE = 0.1; // mirrors OrdersService

/** Deterministic PRNG so re-running on a fresh DB yields the same demo data. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a realistic status given how long ago the order was placed. */
function statusForAge(daysAgo: number, r: number): OrderStatus {
  if (daysAgo > 60) {
    return r < 0.85 ? OrderStatus.DELIVERED : r < 0.94 ? OrderStatus.SHIPPED : OrderStatus.CANCELLED;
  }
  if (daysAgo > 21) {
    return r < 0.5 ? OrderStatus.DELIVERED : r < 0.78 ? OrderStatus.SHIPPED : r < 0.9 ? OrderStatus.PROCESSING : OrderStatus.CANCELLED;
  }
  if (daysAgo > 7) {
    return r < 0.38 ? OrderStatus.SHIPPED : r < 0.7 ? OrderStatus.PROCESSING : r < 0.9 ? OrderStatus.DELIVERED : OrderStatus.CANCELLED;
  }
  return r < 0.6 ? OrderStatus.PENDING : r < 0.85 ? OrderStatus.PROCESSING : r < 0.95 ? OrderStatus.SHIPPED : OrderStatus.CANCELLED;
}

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'ecommerce_db',
    entities: [User, Category, Product, Cart, CartItem, Order, OrderItem],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  });

  await dataSource.initialize();
  console.log('Connected. Seeding…');

  const categoryRepo = dataSource.getRepository(Category);
  const productRepo = dataSource.getRepository(Product);
  const userRepo = dataSource.getRepository(User);

  // Users — upsert by email.
  await upsertUser(userRepo, {
    email: 'admin@ecommerce.com',
    password: 'Admin@123456',
    firstName: 'Maison',
    lastName: 'Admin',
    role: UserRole.ADMIN,
  });
  await upsertUser(userRepo, {
    email: 'admin@yopmail.com',
    password: 'admin@123',
    firstName: 'Yop',
    lastName: 'Admin',
    role: UserRole.ADMIN,
  });
  await upsertUser(userRepo, {
    email: 'customer@ecommerce.com',
    password: 'Customer@123456',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: UserRole.CUSTOMER,
  });
  for (const c of CUSTOMERS) {
    await upsertUser(userRepo, {
      email: c.email,
      password: 'Customer@123456',
      firstName: c.firstName,
      lastName: c.lastName,
      role: UserRole.CUSTOMER,
    });
  }
  console.log(`  ✓ ${2 + CUSTOMERS.length} users`);

  // Categories — upsert by slug.
  const categoryBySlug = new Map<string, Category>();
  for (const c of CATEGORIES) {
    let category = await categoryRepo.findOne({ where: { slug: c.slug } });
    if (!category) category = categoryRepo.create(c);
    else Object.assign(category, c);
    categoryBySlug.set(c.slug, await categoryRepo.save(category));
  }
  console.log(`  ✓ ${CATEGORIES.length} categories`);

  // Products — upsert by name (name is the natural seed key).
  for (const p of ALL_PRODUCTS) {
    const category = categoryBySlug.get(p.categorySlug);
    if (!category) throw new Error(`Missing category ${p.categorySlug} for ${p.name}`);

    let product = await productRepo.findOne({ where: { name: p.name } });
    if (!product) product = productRepo.create();
    Object.assign(product, {
      name: p.name,
      description: p.description,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      imageUrl: p.image,
      rating: p.rating,
      reviewCount: p.reviewCount,
      colors: p.colors,
      sizes: p.sizes,
      stockQuantity: p.stockQuantity,
      isActive: true,
      categoryId: category.id,
    });
    await productRepo.save(product);
  }
  console.log(`  ✓ ${ALL_PRODUCTS.length} products`);

  // Orders — generated once on a fresh database. Idempotent: if any order
  // already exists we skip entirely rather than risk duplicating history.
  const orderRepo = dataSource.getRepository(Order);
  const existingOrders = await orderRepo.count();
  if (existingOrders > 0) {
    console.log(`  ✓ orders present (${existingOrders}) — skipped`);
  } else {
    const products = await productRepo.find();
    const customerUsers = await Promise.all(
      CUSTOMERS.map(async (c) => ({
        seed: c,
        user: await userRepo.findOne({ where: { email: c.email } }),
      })),
    );
    const buyers = customerUsers.filter((c) => c.user);

    const rng = mulberry32(20260629);
    const createdStamps: Array<{ id: string; date: Date }> = [];

    for (let i = 0; i < ORDER_COUNT; i++) {
      const buyer = buyers[Math.floor(rng() * buyers.length)];
      const user = buyer.user!;
      // Force the first few orders to be very recent so the catalogue always has
      // some live PENDING/PROCESSING work to fulfil; the rest spread over 6 months.
      const daysAgo = i < 6 ? i : Math.floor(rng() * 175);
      const placedAt = new Date(Date.now() - daysAgo * 86_400_000 - Math.floor(rng() * 86_400_000));

      // 1–3 distinct products, qty 1–2 each — snapshot price + name like a real order.
      const nItems = 1 + Math.floor(rng() * 3);
      const used = new Set<string>();
      const items: OrderItem[] = [];
      let subtotal = 0;
      for (let j = 0; j < nItems; j++) {
        let product = products[Math.floor(rng() * products.length)];
        let guard = 0;
        while (used.has(product.id) && guard < 6) {
          product = products[Math.floor(rng() * products.length)];
          guard++;
        }
        if (used.has(product.id)) continue;
        used.add(product.id);
        const qty = 1 + Math.floor(rng() * 2);
        const unitPrice = Number(product.price);
        const lineTotal = Math.round(unitPrice * qty * 100) / 100;
        subtotal += lineTotal;
        items.push(
          orderRepo.manager.create(OrderItem, {
            productId: product.id,
            productName: product.name,
            unitPrice,
            quantity: qty,
            lineTotal,
          }),
        );
      }
      subtotal = Math.round(subtotal * 100) / 100;
      const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;
      const status = statusForAge(daysAgo, rng());

      const order = orderRepo.create({
        userId: user.id,
        status,
        items,
        subtotal,
        tax,
        shippingCost: 0,
        total,
        shippingAddress: {
          fullName: `${user.firstName} ${user.lastName}`,
          line1: `${10 + Math.floor(rng() * 200)} High Street`,
          city: buyer.seed.city,
          state: buyer.seed.state,
          postalCode: `${String.fromCharCode(65 + Math.floor(rng() * 26))}${1 + Math.floor(rng() * 9)} ${1 + Math.floor(rng() * 9)}${String.fromCharCode(65 + Math.floor(rng() * 26))}${String.fromCharCode(65 + Math.floor(rng() * 26))}`,
          country: 'United Kingdom',
        },
        stripePaymentIntentId: null,
      });
      const saved = await orderRepo.save(order);
      createdStamps.push({ id: saved.id, date: placedAt });
    }

    // @CreateDateColumn defaults to now() on insert; backdate explicitly so the
    // revenue-by-month chart and recent-orders list spread across real history.
    for (const { id, date } of createdStamps) {
      await orderRepo
        .createQueryBuilder()
        .update(Order)
        .set({ createdAt: date })
        .where('id = :id', { id })
        .execute();
    }
    console.log(`  ✓ ${ORDER_COUNT} orders`);
  }

  await dataSource.destroy();
  console.log('Seed complete.');
}

async function upsertUser(
  userRepo: import('typeorm').Repository<User>,
  data: { email: string; password: string; firstName: string; lastName: string; role: UserRole },
) {
  let user = await userRepo.findOne({ where: { email: data.email } });
  if (!user) user = userRepo.create({ email: data.email });
  // Seed accounts are demo logins: always (re)set the documented password, name
  // and role so `npm run seed` reliably restores the credentials in CLAUDE.md —
  // even if the row already existed with a different password from an earlier run.
  user.passwordHash = await bcrypt.hash(data.password, 12);
  user.firstName = data.firstName;
  user.lastName = data.lastName;
  user.role = data.role;
  await userRepo.save(user);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
