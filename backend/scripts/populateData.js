// backend/scripts/populateData.js - NEW FILE
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'wedmantra'
});

// Sample data
const sampleData = {
  // Users (customers, admins)
  users: [
    {
      email: 'admin@wedmantra.com',
      password: 'Admin123',
      first_name: 'Super',
      last_name: 'Admin',
      role: 'superadmin',
      phone: '9876543210',
      email_verified: true,
      phone_verified: true
    },
    {
      email: 'manager@wedmantra.com',
      password: 'Manager123',
      first_name: 'Store',
      last_name: 'Manager',
      role: 'admin',
      phone: '9876543211',
      email_verified: true,
      phone_verified: true
    },
    {
      email: 'priya@example.com',
      password: 'Customer123',
      first_name: 'Priya',
      last_name: 'Sharma',
      role: 'customer',
      phone: '9876543212',
      email_verified: true,
      phone_verified: true
    },
    {
      email: 'anita@example.com',
      password: 'Customer123',
      first_name: 'Anita',
      last_name: 'Gupta',
      role: 'customer',
      phone: '9876543213',
      email_verified: true,
      phone_verified: false
    },
    {
      email: 'meera@example.com',
      password: 'Customer123',
      first_name: 'Meera',
      last_name: 'Patel',
      role: 'customer',
      phone: '9876543214',
      email_verified: true,
      phone_verified: true
    }
  ],

  // Categories
  categories: [
    {
      name: 'Sarees',
      slug: 'sarees',
      description: 'Traditional Indian sarees collection',
      image_url: 'https://res.cloudinary.com/demo/image/upload/sarees-category.jpg',
      sort_order: 1
    },
    {
      name: 'Blouses',
      slug: 'blouses',
      description: 'Designer blouse collection',
      image_url: 'https://res.cloudinary.com/demo/image/upload/blouses-category.jpg',
      sort_order: 2
    },
    {
      name: 'Lehengas',
      slug: 'lehengas',
      description: 'Bridal and festive lehengas',
      image_url: 'https://res.cloudinary.com/demo/image/upload/lehengas-category.jpg',
      sort_order: 3
    },
    {
      name: 'Suits',
      slug: 'suits',
      description: 'Salwar suits and dress materials',
      image_url: 'https://res.cloudinary.com/demo/image/upload/suits-category.jpg',
      sort_order: 4
    },
    {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Jewelry and accessories',
      image_url: 'https://res.cloudinary.com/demo/image/upload/accessories-category.jpg',
      sort_order: 5
    }
  ],

  // Subcategories
  subcategories: [
    // Saree subcategories
    { category_id: 1, name: 'Silk Sarees', slug: 'silk-sarees', description: 'Pure silk sarees collection' },
    { category_id: 1, name: 'Cotton Sarees', slug: 'cotton-sarees', description: 'Comfortable cotton sarees' },
    { category_id: 1, name: 'Georgette Sarees', slug: 'georgette-sarees', description: 'Elegant georgette sarees' },
    { category_id: 1, name: 'Chiffon Sarees', slug: 'chiffon-sarees', description: 'Light and airy chiffon sarees' },
    { category_id: 1, name: 'Designer Sarees', slug: 'designer-sarees', description: 'Designer sarees for special occasions' },
    
    // Blouse subcategories
    { category_id: 2, name: 'Readymade Blouses', slug: 'readymade-blouses', description: 'Ready to wear blouses' },
    { category_id: 2, name: 'Blouse Pieces', slug: 'blouse-pieces', description: 'Blouse fabrics for stitching' },
    
    // Lehenga subcategories
    { category_id: 3, name: 'Bridal Lehengas', slug: 'bridal-lehengas', description: 'Wedding lehengas' },
    { category_id: 3, name: 'Party Lehengas', slug: 'party-lehengas', description: 'Party wear lehengas' }
  ],

  // Brands
  brands: [
    {
      name: 'Kanchipuram Silk House',
      slug: 'kanchipuram-silk-house',
      description: 'Traditional Kanchipuram silk sarees',
      logo_url: 'https://res.cloudinary.com/demo/image/upload/kanchipuram-logo.jpg'
    },
    {
      name: 'Banarasi Weaves',
      slug: 'banarasi-weaves',
      description: 'Authentic Banarasi sarees',
      logo_url: 'https://res.cloudinary.com/demo/image/upload/banarasi-logo.jpg'
    },
    {
      name: 'Cotton Craft',
      slug: 'cotton-craft',
      description: 'Premium cotton sarees',
      logo_url: 'https://res.cloudinary.com/demo/image/upload/cotton-craft-logo.jpg'
    },
    {
      name: 'Designer Studio',
      slug: 'designer-studio',
      description: 'Modern designer wear',
      logo_url: 'https://res.cloudinary.com/demo/image/upload/designer-studio-logo.jpg'
    },
    {
      name: 'Ethnic Elegance',
      slug: 'ethnic-elegance',
      description: 'Traditional ethnic wear',
      logo_url: 'https://res.cloudinary.com/demo/image/upload/ethnic-elegance-logo.jpg'
    }
  ],

  // Products
  products: [
    // Silk Sarees
    {
      name: 'Royal Blue Kanchipuram Silk Saree',
      slug: 'royal-blue-kanchipuram-silk-saree',
      description: 'Exquisite royal blue Kanchipuram silk saree with traditional gold zari work. Perfect for weddings and special occasions.',
      short_description: 'Royal blue silk saree with gold zari work',
      category_id: 1,
      subcategory_id: 1,
      brand_id: 1,
      sku: 'KSH-RB-001',
      price: 8500.00,
      sale_price: 7200.00,
      cost_price: 5000.00,
      fabric: 'Silk',
      work_type: 'Zari Work',
      occasion: 'Wedding',
      region: 'Kanchipuram',
      length: 6.0,
      blouse_piece: true,
      stock_quantity: 15,
      featured: true,
      status: 'active'
    },
    {
      name: 'Elegant Red Banarasi Saree',
      slug: 'elegant-red-banarasi-saree',
      description: 'Traditional red Banarasi saree with intricate brocade work. A timeless piece for your special moments.',
      short_description: 'Red Banarasi saree with brocade work',
      category_id: 1,
      subcategory_id: 1,
      brand_id: 2,
      sku: 'BW-ER-001',
      price: 6500.00,
      sale_price: 5500.00,
      cost_price: 3500.00,
      fabric: 'Silk',
      work_type: 'Brocade',
      occasion: 'Wedding',
      region: 'Banarasi',
      length: 6.0,
      blouse_piece: true,
      stock_quantity: 12,
      featured: true,
      status: 'active'
    },
    {
      name: 'Soft Pink Cotton Saree',
      slug: 'soft-pink-cotton-saree',
      description: 'Comfortable soft pink cotton saree perfect for daily wear. Easy to maintain and comfortable all day.',
      short_description: 'Daily wear cotton saree',
      category_id: 1,
      subcategory_id: 2,
      brand_id: 3,
      sku: 'CC-SP-001',
      price: 1200.00,
      sale_price: null,
      cost_price: 600.00,
      fabric: 'Cotton',
      work_type: 'Printed',
      occasion: 'Casual',
      region: 'South Indian',
      length: 6.0,
      blouse_piece: true,
      stock_quantity: 25,
      featured: false,
      status: 'active'
    },
    {
      name: 'Green Georgette Party Saree',
      slug: 'green-georgette-party-saree',
      description: 'Stunning green georgette saree with sequin work. Perfect for parties and celebrations.',
      short_description: 'Party wear georgette saree',
      category_id: 1,
      subcategory_id: 3,
      brand_id: 4,
      sku: 'DS-GG-001',
      price: 3500.00,
      sale_price: 2800.00,
      cost_price: 1800.00,
      fabric: 'Georgette',
      work_type: 'Sequin Work',
      occasion: 'Party',
      region: 'Modern',
      length: 6.0,
      blouse_piece: true,
      stock_quantity: 18,
      featured: true,
      status: 'active'
    },
    {
      name: 'Black Chiffon Designer Saree',
      slug: 'black-chiffon-designer-saree',
      description: 'Sophisticated black chiffon saree with modern embellishments. Ideal for formal events.',
      short_description: 'Designer chiffon saree',
      category_id: 1,
      subcategory_id: 4,
      brand_id: 4,
      sku: 'DS-BC-001',
      price: 4200.00,
      sale_price: null,
      cost_price: 2500.00,
      fabric: 'Chiffon',
      work_type: 'Embellished',
      occasion: 'Formal',
      region: 'Modern',
      length: 6.0,
      blouse_piece: true,
      stock_quantity: 10,
      featured: false,
      status: 'active'
    },
    {
      name: 'Maroon Velvet Lehenga',
      slug: 'maroon-velvet-lehenga',
      description: 'Rich maroon velvet lehenga with heavy embroidery work. Perfect for bridal occasions.',
      short_description: 'Bridal velvet lehenga',
      category_id: 3,
      subcategory_id: 8,
      brand_id: 5,
      sku: 'EE-MV-001',
      price: 15000.00,
      sale_price: 12000.00,
      cost_price: 8000.00,
      fabric: 'Velvet',
      work_type: 'Heavy Embroidery',
      occasion: 'Wedding',
      region: 'Rajasthani',
      length: null,
      blouse_piece: true,
      stock_quantity: 5,
      featured: true,
      status: 'active'
    },
    {
      name: 'Golden Tissue Silk Saree',
      slug: 'golden-tissue-silk-saree',
      description: 'Luxurious golden tissue silk saree with minimal border. Perfect for festive occasions.',
      short_description: 'Festive tissue silk saree',
      category_id: 1,
      subcategory_id: 1,
      brand_id: 1,
      sku: 'KSH-GT-001',
      price: 5800.00,
      sale_price: null,
      cost_price: 3500.00,
      fabric: 'Tissue Silk',
      work_type: 'Minimal Border',
      occasion: 'Festival',
      region: 'Kanchipuram',
      length: 6.0,
      blouse_piece: true,
      stock_quantity: 8,
      featured: false,
      status: 'active'
    },
    {
      name: 'Navy Blue Cotton Suit Set',
      slug: 'navy-blue-cotton-suit-set',
      description: 'Comfortable navy blue cotton suit set with dupatta. Perfect for office wear.',
      short_description: 'Office wear cotton suit',
      category_id: 4,
      subcategory_id: null,
      brand_id: 3,
      sku: 'CC-NB-001',
      price: 2200.00,
      sale_price: 1800.00,
      cost_price: 1200.00,
      fabric: 'Cotton',
      work_type: 'Printed',
      occasion: 'Office',
      region: 'North Indian',
      length: null,
      blouse_piece: false,
      stock_quantity: 20,
      featured: false,
      status: 'active'
    }
  ],

  // Banners
  banners: [
    {
      title: 'Wedding Collection 2024',
      subtitle: 'Up to 40% Off',
      description: 'Discover our exclusive wedding collection with traditional sarees and lehengas',
      image_url: 'https://res.cloudinary.com/demo/image/upload/wedding-banner.jpg',
      mobile_image_url: 'https://res.cloudinary.com/demo/image/upload/wedding-banner-mobile.jpg',
      banner_type: 'homepage_hero',
      action_type: 'category',
      action_value: '1',
      button_text: 'Shop Now',
      button_color: '#FF6B35',
      target_audience: 'all',
      sort_order: 1,
      is_active: true,
      show_on_mobile: true,
      show_on_web: true
    },
    {
      title: 'Festive Sale',
      subtitle: 'Mega Discounts',
      description: 'Get ready for the festive season with our mega sale',
      image_url: 'https://res.cloudinary.com/demo/image/upload/festive-banner.jpg',
      mobile_image_url: 'https://res.cloudinary.com/demo/image/upload/festive-banner-mobile.jpg',
      banner_type: 'sale_banner',
      action_type: 'search',
      action_value: 'sale',
      button_text: 'View Sale',
      button_color: '#E74C3C',
      target_audience: 'all',
      sort_order: 2,
      is_active: true,
      show_on_mobile: true,
      show_on_web: true
    },
    {
      title: 'New Arrivals',
      subtitle: 'Fresh Collection',
      description: 'Check out our latest saree collection',
      image_url: 'https://res.cloudinary.com/demo/image/upload/new-arrivals-banner.jpg',
      mobile_image_url: 'https://res.cloudinary.com/demo/image/upload/new-arrivals-banner-mobile.jpg',
      banner_type: 'product_showcase',
      action_type: 'category',
      action_value: '1',
      button_text: 'Explore',
      button_color: '#3498DB',
      target_audience: 'all',
      sort_order: 3,
      is_active: true,
      show_on_mobile: true,
      show_on_web: true
    }
  ],

  // Coupons
  coupons: [
    {
      code: 'WELCOME10',
      name: 'Welcome Discount',
      description: 'Get 10% off on your first order',
      type: 'percentage',
      value: 10.00,
      minimum_amount: 1000.00,
      maximum_discount: 500.00,
      usage_limit: 1000,
      used_count: 45,
      valid_from: new Date('2024-01-01'),
      valid_until: new Date('2024-12-31'),
      is_active: true
    },
    {
      code: 'FESTIVE20',
      name: 'Festive Sale',
      description: 'Get 20% off on orders above ₹2000',
      type: 'percentage',
      value: 20.00,
      minimum_amount: 2000.00,
      maximum_discount: 1000.00,
      usage_limit: 500,
      used_count: 156,
      valid_from: new Date('2024-01-01'),
      valid_until: new Date('2024-12-31'),
      is_active: true
    },
    {
      code: 'FLAT500',
      name: 'Flat ₹500 Off',
      description: 'Get flat ₹500 off on orders above ₹3000',
      type: 'fixed_amount',
      value: 500.00,
      minimum_amount: 3000.00,
      maximum_discount: null,
      usage_limit: 200,
      used_count: 78,
      valid_from: new Date('2024-01-01'),
      valid_until: new Date('2024-12-31'),
      is_active: true
    }
  ]
};

// Helper function to execute queries
async function executeQuery(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

// Hash password
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Clear existing data (be careful with this!)
async function clearData() {
  console.log('🗑️  Clearing existing data...');
  
  const tables = [
    'order_status_history',
    'order_items', 
    'orders',
    'coupon_usage',
    'coupons',
    'banner_interactions',
    'banners',
    'cart_items',
    'wishlist_items',
    'product_reviews',
    'product_views',
    'search_queries',
    'product_attributes',
    'product_media',
    'products',
    'subcategories',
    'brands',
    'categories',
    'user_addresses',
    'password_reset_tokens',
    'otp_verifications',
    'notifications',
    'fcm_tokens',
    'users'
  ];

  for (const table of tables) {
    try {
      await executeQuery(`DELETE FROM ${table}`);
      // Reset auto-increment
      await executeQuery(`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1`);
      console.log(`Cleared ${table}`);
    } catch (error) {
      console.log(`Could not clear ${table}: ${error.message}`);
    }
  }
}

// Populate users
async function populateUsers() {
  console.log('👥 Populating users...');
  
  for (const user of sampleData.users) {
    const hashedPassword = await hashPassword(user.password);
    
    await executeQuery(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, email_verified, phone_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [user.email, hashedPassword, user.first_name, user.last_name, user.role, user.phone, user.email_verified, user.phone_verified]
    );
    
    console.log(`Created user: ${user.email}`);
  }
}

// Populate categories
async function populateCategories() {
  console.log('Populating categories...');
  
  for (const category of sampleData.categories) {
    await executeQuery(
      `INSERT INTO categories (name, slug, description, image_url, sort_order, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())`,
      [category.name, category.slug, category.description, category.image_url, category.sort_order]
    );
    
    console.log(`Created category: ${category.name}`);
  }
}

// Populate subcategories
async function populateSubcategories() {
  console.log('Populating subcategories...');
  
  for (const subcategory of sampleData.subcategories) {
    await executeQuery(
      `INSERT INTO subcategories (category_id, name, slug, description, sort_order, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 0, true, NOW(), NOW())`,
      [subcategory.category_id, subcategory.name, subcategory.slug, subcategory.description]
    );
    
    console.log(`Created subcategory: ${subcategory.name}`);
  }
}

// Populate brands
async function populateBrands() {
  console.log('Populating brands...');
  
  for (const brand of sampleData.brands) {
    await executeQuery(
      `INSERT INTO brands (name, slug, description, logo_url, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
      [brand.name, brand.slug, brand.description, brand.logo_url]
    );
    
    console.log(`Created brand: ${brand.name}`);
  }
}

// Populate products
async function populateProducts() {
  console.log('Populating products...');
  
  for (const product of sampleData.products) {
    const result = await executeQuery(
      `INSERT INTO products (
        name, slug, description, short_description, category_id, subcategory_id, brand_id,
        sku, price, sale_price, cost_price, fabric, work_type, occasion, region, length,
        blouse_piece, stock_quantity, featured, status, created_at, updated_at, created_by
       ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW(), 1
       ) RETURNING id`,
      [
        product.name, product.slug, product.description, product.short_description,
        product.category_id, product.subcategory_id, product.brand_id, product.sku,
        product.price, product.sale_price, product.cost_price, product.fabric,
        product.work_type, product.occasion, product.region, product.length,
        product.blouse_piece, product.stock_quantity, product.featured, product.status
      ]
    );
    
    const productId = result.rows[0].id;
    
    // Add sample product images
    const imageUrls = [
      `https://res.cloudinary.com/demo/image/upload/saree-${productId}-1.jpg`,
      `https://res.cloudinary.com/demo/image/upload/saree-${productId}-2.jpg`,
      `https://res.cloudinary.com/demo/image/upload/saree-${productId}-3.jpg`
    ];
    
    for (let i = 0; i < imageUrls.length; i++) {
      await executeQuery(
        `INSERT INTO product_media (product_id, media_url, media_type, alt_text, sort_order, is_primary, created_at)
         VALUES ($1, $2, 'image', $3, $4, $5, NOW())`,
        [productId, imageUrls[i], `${product.name} - Image ${i + 1}`, i, i === 0]
      );
    }
    
    console.log(`Created product: ${product.name}`);
  }
}

// Populate banners
async function populateBanners() {
  console.log('Populating banners...');
  
  for (const banner of sampleData.banners) {
    await executeQuery(
      `INSERT INTO banners (
        title, subtitle, description, image_url, mobile_image_url, banner_type,
        action_type, action_value, button_text, button_color, target_audience,
        sort_order, is_active, show_on_mobile, show_on_web, created_at, updated_at, created_by
       ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW(), 1
       )`,
      [
        banner.title, banner.subtitle, banner.description, banner.image_url,
        banner.mobile_image_url, banner.banner_type, banner.action_type,
        banner.action_value, banner.button_text, banner.button_color,
        banner.target_audience, banner.sort_order, banner.is_active,
        banner.show_on_mobile, banner.show_on_web
      ]
    );
    
    console.log(`Created banner: ${banner.title}`);
  }
}

// Populate coupons
async function populateCoupons() {
  console.log('Populating coupons...');
  
  for (const coupon of sampleData.coupons) {
    await executeQuery(
      `INSERT INTO coupons (
        code, name, description, type, value, minimum_amount, maximum_discount,
        usage_limit, used_count, valid_from, valid_until, is_active, created_at, updated_at
       ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
       )`,
      [
        coupon.code, coupon.name, coupon.description, coupon.type, coupon.value,
        coupon.minimum_amount, coupon.maximum_discount, coupon.usage_limit,
        coupon.used_count, coupon.valid_from, coupon.valid_until, coupon.is_active
      ]
    );
    
    console.log(`Created coupon: ${coupon.code}`);
  }
}

// Add sample addresses for users
async function populateAddresses() {
  console.log('Populating user addresses...');
  
  // Sample addresses for customer users (IDs 3, 4, 5)
  const addresses = [
    {
      user_id: 3,
      type: 'home',
      full_name: 'Priya Sharma',
      phone: '9876543212',
      address_line1: '123 MG Road',
      address_line2: 'Near Metro Station',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      landmark: 'Opposite City Mall',
      is_default: true
    },
    {
      user_id: 3,
      type: 'work',
      full_name: 'Priya Sharma',
      phone: '9876543212',
      address_line1: '456 Business District',
      address_line2: 'Tower A, Floor 12',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400070',
      landmark: 'Near Tech Park',
      is_default: false
    },
    {
      user_id: 4,
      type: 'home',
      full_name: 'Anita Gupta',
      phone: '9876543213',
      address_line1: '789 Sector 15',
      address_line2: 'Block B',
      city: 'Gurgaon',
      state: 'Haryana',
      pincode: '122001',
      landmark: 'Near DLF Mall',
      is_default: true
    },
    {
      user_id: 5,
      type: 'home',
      full_name: 'Meera Patel',
      phone: '9876543214',
      address_line1: '321 Satellite Road',
      address_line2: 'Apartment 5B',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380015',
      landmark: 'Near S.G. Highway',
      is_default: true
    }
  ];
  
  for (const address of addresses) {
    await executeQuery(
      `INSERT INTO user_addresses (
        user_id, type, full_name, phone, address_line1, address_line2,
        city, state, pincode, landmark, is_default, created_at, updated_at
       ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
       )`,
      [
        address.user_id, address.type, address.full_name, address.phone,
        address.address_line1, address.address_line2, address.city, address.state,
        address.pincode, address.landmark, address.is_default
      ]
    );
  }
  
  console.log('Created sample addresses');
}

// Create sample orders
async function populateOrders() {
  console.log('Populating sample orders...');
  
  const orders = [
    {
      user_id: 3,
      order_number: 'ORD-' + Date.now() + '-001',
      subtotal: 7200.00,
      tax_amount: 1296.00,
      shipping_amount: 0.00,
      discount_amount: 0.00,
      total_amount: 8496.00,
      status: 'delivered',
      payment_status: 'paid',
      shipping_full_name: 'Priya Sharma',
      shipping_phone: '9876543212',
      shipping_address_line1: '123 MG Road',
      shipping_address_line2: 'Near Metro Station',
      shipping_city: 'Mumbai',
      shipping_state: 'Maharashtra',
      shipping_pincode: '400001',
      customer_notes: 'Please deliver between 10 AM to 6 PM',
      tracking_number: 'TRK123456789',
      shipped_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      delivered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    },
    {
      user_id: 4,
      order_number: 'ORD-' + Date.now() + '-002',
      subtotal: 5500.00,
      tax_amount: 990.00,
      shipping_amount: 0.00,
      discount_amount: 500.00,
      total_amount: 5990.00,
      status: 'shipped',
      payment_status: 'paid',
      shipping_full_name: 'Anita Gupta',
      shipping_phone: '9876543213',
      shipping_address_line1: '789 Sector 15',
      shipping_address_line2: 'Block B',
      shipping_city: 'Gurgaon',
      shipping_state: 'Haryana',
      shipping_pincode: '122001',
      customer_notes: 'Call before delivery',
      tracking_number: 'TRK987654321',
      shipped_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      delivered_at: null,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    },
    {
      user_id: 5,
      order_number: 'ORD-' + Date.now() + '-003',
      subtotal: 2800.00,
      tax_amount: 504.00,
      shipping_amount: 50.00,
      discount_amount: 0.00,
      total_amount: 3354.00,
      status: 'processing',
      payment_status: 'paid',
      shipping_full_name: 'Meera Patel',
      shipping_phone: '9876543214',
      shipping_address_line1: '321 Satellite Road',
      shipping_address_line2: 'Apartment 5B',
      shipping_city: 'Ahmedabad',
      shipping_state: 'Gujarat',
      shipping_pincode: '380015',
      customer_notes: 'Weekend delivery preferred',
      tracking_number: null,
      shipped_at: null,
      delivered_at: null,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    }
  ];
  
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    
    const result = await executeQuery(
      `INSERT INTO orders (
        order_number, user_id, subtotal, tax_amount, shipping_amount, discount_amount,
        total_amount, shipping_full_name, shipping_phone, shipping_address_line1,
        shipping_address_line2, shipping_city, shipping_state, shipping_pincode,
        status, payment_status, tracking_number, shipped_at, delivered_at,
        customer_notes, created_at, updated_at
       ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW()
       ) RETURNING id`,
      [
        order.order_number, order.user_id, order.subtotal, order.tax_amount,
        order.shipping_amount, order.discount_amount, order.total_amount,
        order.shipping_full_name, order.shipping_phone, order.shipping_address_line1,
        order.shipping_address_line2, order.shipping_city, order.shipping_state,
        order.shipping_pincode, order.status, order.payment_status,
        order.tracking_number, order.shipped_at, order.delivered_at,
        order.customer_notes, order.created_at
      ]
    );
    
    const orderId = result.rows[0].id;
    
    // Add order items
    const orderItems = [
      { product_id: 1, quantity: 1, unit_price: 7200.00 }, // Royal Blue Kanchipuram
      { product_id: 2, quantity: 1, unit_price: 5500.00 }, // Elegant Red Banarasi
      { product_id: 4, quantity: 1, unit_price: 2800.00 }  // Green Georgette Party
    ];
    
    const orderItem = orderItems[i];
    
    // Get product details
    const productResult = await executeQuery(
      'SELECT name, sku FROM products WHERE id = $1',
      [orderItem.product_id]
    );
    
    const product = productResult.rows[0];
    
    await executeQuery(
      `INSERT INTO order_items (
        order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, created_at
       ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW()
       )`,
      [
        orderId, orderItem.product_id, product.name, product.sku,
        orderItem.quantity, orderItem.unit_price, 
        (orderItem.quantity * orderItem.unit_price)
      ]
    );
    
    // Add order status history
    const statusHistory = [
      { status: 'pending', notes: 'Order placed successfully', days_ago: 7 },
      { status: 'confirmed', notes: 'Order confirmed and payment received', days_ago: 6 },
      { status: 'processing', notes: 'Order is being prepared', days_ago: 5 }
    ];
    
    // Add status based on current order status
    if (order.status === 'shipped' || order.status === 'delivered') {
      statusHistory.push({ 
        status: 'shipped', 
        notes: `Order shipped with tracking number ${order.tracking_number}`, 
        days_ago: order.status === 'delivered' ? 3 : 1 
      });
    }
    
    if (order.status === 'delivered') {
      statusHistory.push({ 
        status: 'delivered', 
        notes: 'Order delivered successfully', 
        days_ago: 2 
      });
    }
    
    for (const history of statusHistory) {
      if (history.status === order.status || 
          (order.status === 'shipped' && ['pending', 'confirmed', 'processing', 'shipped'].includes(history.status)) ||
          (order.status === 'delivered' && ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].includes(history.status))) {
        
        const historyDate = new Date(order.created_at.getTime() + (7 - history.days_ago) * 24 * 60 * 60 * 1000);
        
        await executeQuery(
          `INSERT INTO order_status_history (order_id, status, notes, created_by, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, history.status, history.notes, 1, historyDate]
        );
      }
    }
    
    console.log(`Created order: ${order.order_number}`);
  }
}

// Add sample cart items
async function populateCartItems() {
  console.log('🛒 Populating cart items...');
  
  const cartItems = [
    { user_id: 3, product_id: 5, quantity: 1 }, // Black Chiffon Designer Saree
    { user_id: 3, product_id: 7, quantity: 2 }, // Golden Tissue Silk Saree
    { user_id: 4, product_id: 3, quantity: 1 }, // Soft Pink Cotton Saree
    { user_id: 4, product_id: 6, quantity: 1 }, // Maroon Velvet Lehenga
    { user_id: 5, product_id: 8, quantity: 3 }  // Navy Blue Cotton Suit Set
  ];
  
  for (const item of cartItems) {
    await executeQuery(
      `INSERT INTO cart_items (user_id, product_id, quantity, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [item.user_id, item.product_id, item.quantity]
    );
  }
  
  console.log('Created sample cart items');
}

// Add sample wishlist items
async function populateWishlistItems() {
  console.log('Populating wishlist items...');
  
  const wishlistItems = [
    { user_id: 3, product_id: 6 }, // Maroon Velvet Lehenga
    { user_id: 3, product_id: 8 }, // Navy Blue Cotton Suit Set
    { user_id: 4, product_id: 1 }, // Royal Blue Kanchipuram Silk Saree
    { user_id: 4, product_id: 4 }, // Green Georgette Party Saree
    { user_id: 5, product_id: 2 }, // Elegant Red Banarasi Saree
    { user_id: 5, product_id: 5 }  // Black Chiffon Designer Saree
  ];
  
  for (const item of wishlistItems) {
    await executeQuery(
      `INSERT INTO wishlist_items (user_id, product_id, created_at)
       VALUES ($1, $2, NOW())`,
      [item.user_id, item.product_id]
    );
  }
  
  console.log('Created sample wishlist items');
}

// Add sample product reviews
async function populateReviews() {
  console.log('Populating product reviews...');
  
  const reviews = [
    {
      product_id: 1,
      user_id: 3,
      order_id: 1,
      rating: 5,
      title: 'Absolutely Beautiful!',
      review: 'The saree is exactly as shown in the pictures. The quality is excellent and the zari work is stunning. Received many compliments when I wore it to my cousin\'s wedding.',
      is_verified_purchase: true,
      is_approved: true
    },
    {
      product_id: 2,
      user_id: 4,
      order_id: 2,
      rating: 4,
      title: 'Good Quality Banarasi',
      review: 'Nice Banarasi saree with good brocade work. The color is slightly different from the photo but still very beautiful. Good value for money.',
      is_verified_purchase: true,
      is_approved: true
    },
    {
      product_id: 4,
      user_id: 5,
      order_id: 3,
      rating: 5,
      title: 'Perfect for Parties',
      review: 'Love this georgette saree! It\'s so comfortable to wear and the sequin work catches light beautifully. Perfect for evening parties.',
      is_verified_purchase: true,
      is_approved: true
    },
    {
      product_id: 3,
      user_id: 4,
      rating: 4,
      title: 'Great for Daily Wear',
      review: 'Comfortable cotton saree, easy to maintain. Good for office wear. The color is vibrant and fabric quality is good.',
      is_verified_purchase: false,
      is_approved: true
    }
  ];
  
  for (const review of reviews) {
    await executeQuery(
      `INSERT INTO product_reviews (
        product_id, user_id, order_id, rating, title, review, 
        is_verified_purchase, is_approved, created_at, updated_at
       ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
       )`,
      [
        review.product_id, review.user_id, review.order_id, review.rating,
        review.title, review.review, review.is_verified_purchase, review.is_approved
      ]
    );
  }
  
  console.log('Created sample product reviews');
}

// Main population function
async function populateAllData(clearFirst = false) {
  try {
    console.log('Starting data population...\n');
    
    if (clearFirst) {
      await clearData();
      console.log('');
    }
    
    // Populate in order (due to foreign key dependencies)
    await populateUsers();
    await populateCategories();
    await populateSubcategories();
    await populateBrands();
    await populateProducts();
    await populateBanners();
    await populateCoupons();
    await populateAddresses();
    await populateOrders();
    await populateCartItems();
    await populateWishlistItems();
    await populateReviews();
    
    console.log('\n🎉 Data population completed successfully!');
    console.log('\n📊 Summary:');
    console.log('👥 Users: 5 (1 superadmin, 1 admin, 3 customers)');
    console.log('📂 Categories: 5');
    console.log('📁 Subcategories: 9');
    console.log('🏷️  Brands: 5');
    console.log('🛍️  Products: 8');
    console.log('🎨 Banners: 3');
    console.log('🎫 Coupons: 3');
    console.log('🏠 Addresses: 4');
    console.log('📦 Orders: 3 (with complete tracking)');
    console.log('🛒 Cart Items: 5');
    console.log('❤️  Wishlist Items: 6');
    console.log('⭐ Reviews: 4');
    
    console.log('\n🔑 Login Credentials:');
    console.log('Superadmin: admin@wedmantra.com / Admin123');
    console.log('Admin: manager@wedmantra.com / Manager123');
    console.log('Customer 1: priya@example.com / Customer123');
    console.log('Customer 2: anita@example.com / Customer123');
    console.log('Customer 3: meera@example.com / Customer123');
    
    console.log('\n📋 Test Order Numbers:');
    console.log('ORD-XXXXXX-001 (delivered)');
    console.log('ORD-XXXXXX-002 (shipped)');
    console.log('ORD-XXXXXX-003 (processing)');
    
    console.log('\n🎫 Test Coupon Codes:');
    console.log('WELCOME10 (10% off, min ₹1000)');
    console.log('FESTIVE20 (20% off, min ₹2000)');
    console.log('FLAT500 (₹500 off, min ₹3000)');
    
  } catch (error) {
    console.error('❌ Error during data population:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  const clearFirst = process.argv.includes('--clear');
  populateAllData(clearFirst);
}

module.exports = { populateAllData };