export const MENU_ITEMS = [
  // Coffee - Premium & Specialty (₹80-250)
  {
    id: 1,
    name: 'Espresso',
    description: 'Strong and bold single shot of espresso.',
    price: 80,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1514432324607-2e467f4af445?w=800&h=600&fit=crop'
  },
  {
    id: 2,
    name: 'Double Espresso',
    description: 'Two shots of premium espresso.',
    price: 120,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1514432324607-2e467f4af445?w=800&h=600&fit=crop'
  },
  {
    id: 3,
    name: 'Americano',
    description: 'Espresso with hot water, smooth and balanced.',
    price: 100,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b3f4?w=800&h=600&fit=crop'
  },
  {
    id: 4,
    name: 'Cappuccino',
    description: 'Rich espresso with steamed milk and a deep layer of foam.',
    price: 120,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&h=600&fit=crop',
    tag: 'Popular',
    sizes: [
      { name: 'small', label: 'S', price: 100 },
      { name: 'medium', label: 'M', price: 120 },
      { name: 'large', label: 'L', price: 150 }
    ]
  },
  {
    id: 5,
    name: 'Latte',
    description: 'Smooth espresso with steamed milk and a light foam top.',
    price: 130,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1541182286-21eaf810afe4?w=800&h=600&fit=crop',
    sizes: [
      { name: 'small', label: 'S', price: 110 },
      { name: 'medium', label: 'M', price: 130 },
      { name: 'large', label: 'L', price: 160 }
    ]
  },
  {
    id: 6,
    name: 'Mocha',
    description: 'Espresso with steamed milk and rich chocolate.',
    price: 140,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&h=600&fit=crop',
    sizes: [
      { name: 'small', label: 'S', price: 120 },
      { name: 'medium', label: 'M', price: 140 },
      { name: 'large', label: 'L', price: 170 }
    ]
  },
  {
    id: 7,
    name: 'Caramel Macchiato',
    description: 'Espresso with vanilla syrup, steamed milk, and caramel drizzle.',
    price: 150,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=800&h=600&fit=crop',
    tag: 'Best Seller',
    sizes: [
      { name: 'small', label: 'S', price: 130 },
      { name: 'medium', label: 'M', price: 150 },
      { name: 'large', label: 'L', price: 180 }
    ]
  },
  {
    id: 8,
    name: 'Flat White',
    description: 'Espresso with velvety steamed milk.',
    price: 140,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=600&fit=crop'
  },
  {
    id: 9,
    name: 'Cortado',
    description: 'Equal parts espresso and steamed milk.',
    price: 110,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1506812574058-fc640266e8a0?w=800&h=600&fit=crop'
  },
  {
    id: 10,
    name: 'Irish Coffee',
    description: 'Hot coffee with Irish whiskey, brown sugar, and whipped cream.',
    price: 200,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1495474472645-4c60aca69b9f?w=800&h=600&fit=crop'
  },
  {
    id: 11,
    name: 'Affogato',
    description: 'Single espresso poured over vanilla ice cream.',
    price: 140,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=600&fit=crop'
  },
  {
    id: 12,
    name: 'Cold Brew Coffee',
    description: 'Smooth and refreshing cold brewed coffee.',
    price: 120,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=600&fit=crop',
    sizes: [
      { name: 'small', label: 'S', price: 100 },
      { name: 'medium', label: 'M', price: 120 },
      { name: 'large', label: 'L', price: 150 }
    ]
  },
  {
    id: 13,
    name: 'Iced Latte',
    description: 'Chilled espresso with milk and ice.',
    price: 130,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=800&h=600&fit=crop',
    sizes: [
      { name: 'small', label: 'S', price: 110 },
      { name: 'medium', label: 'M', price: 130 },
      { name: 'large', label: 'L', price: 160 }
    ]
  },
  {
    id: 14,
    name: 'Iced Cappuccino',
    description: 'Chilled cappuccino with ice and whipped cream.',
    price: 140,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=800&h=600&fit=crop',
    sizes: [
      { name: 'small', label: 'S', price: 120 },
      { name: 'medium', label: 'M', price: 140 },
      { name: 'large', label: 'L', price: 170 }
    ]
  },
  {
    id: 15,
    name: 'Iced Mocha',
    description: 'Cold chocolate-espresso blend with ice.',
    price: 150,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=800&h=600&fit=crop',
    sizes: [
      { name: 'small', label: 'S', price: 130 },
      { name: 'medium', label: 'M', price: 150 },
      { name: 'large', label: 'L', price: 180 }
    ]
  },

  // Tea (₹60-150)
  {
    id: 16,
    name: 'Green Tea',
    description: 'Refreshing and antioxidant-rich green tea.',
    price: 60,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1597318972217-5798141f05b5?w=800&h=600&fit=crop'
  },
  {
    id: 17,
    name: 'Black Tea',
    description: 'Classic strong black tea.',
    price: 60,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1597318972217-5798141f05b5?w=800&h=600&fit=crop'
  },
  {
    id: 18,
    name: 'Chamomile Tea',
    description: 'Soothing and relaxing chamomile blend.',
    price: 70,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1597318972217-5798141f05b5?w=800&h=600&fit=crop'
  },
  {
    id: 19,
    name: 'Oolong Tea',
    description: 'Traditional oolong tea with smooth flavor.',
    price: 80,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1597318972217-5798141f05b5?w=800&h=600&fit=crop'
  },
  {
    id: 20,
    name: 'Iced Matcha Latte',
    description: 'Premium matcha green tea whisked with milk and ice.',
    price: 150,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1515823664972-6d9094fb9436?w=800&h=600&fit=crop'
  },
  {
    id: 21,
    name: 'Chai Latte',
    description: 'Spiced chai with steamed milk.',
    price: 80,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1597318972217-5798141f05b5?w=800&h=600&fit=crop'
  },
  {
    id: 22,
    name: 'Iced Chai',
    description: 'Refreshing iced chai with spices.',
    price: 90,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1597318972217-5798141f05b5?w=800&h=600&fit=crop'
  },

  // Pastries & Bakery (₹40-150)
  {
    id: 23,
    name: 'Croissant',
    description: 'Buttery and flaky French croissant.',
    price: 80,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1444950541872-8c2960214057?w=800&h=600&fit=crop'
  },
  {
    id: 24,
    name: 'Pain au Chocolat',
    description: 'Flaky pastry with chocolate filling.',
    price: 90,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1444950541872-8c2960214057?w=800&h=600&fit=crop'
  },
  {
    id: 25,
    name: 'Almond Croissant',
    description: 'Croissant topped with sliced almonds and cream.',
    price: 110,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1444950541872-8c2960214057?w=800&h=600&fit=crop'
  },
  {
    id: 26,
    name: 'Danish Pastry',
    description: 'Sweet and crispy Danish with various fillings.',
    price: 85,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1585773501247-ed07f0cb2b12?w=800&h=600&fit=crop'
  },
  {
    id: 27,
    name: 'Blueberry Muffin',
    description: 'Fresh blueberry muffin, moist and fluffy.',
    price: 75,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1616365696742-92418fb74db6?w=800&h=600&fit=crop'
  },
  {
    id: 28,
    name: 'Chocolate Muffin',
    description: 'Rich chocolate flavor muffin.',
    price: 75,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1616365696742-92418fb74db6?w=800&h=600&fit=crop'
  },
  {
    id: 29,
    name: 'Banana Nut Bread',
    description: 'Moist banana bread with walnuts.',
    price: 70,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1585773501247-ed07f0cb2b12?w=800&h=600&fit=crop'
  },
  {
    id: 30,
    name: 'Scone with Jam',
    description: 'Traditional scone with jam and clotted cream.',
    price: 95,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1445521458197-bc2172cafcd0?w=800&h=600&fit=crop'
  },
  {
    id: 31,
    name: 'Donut - Glazed',
    description: 'Classic glazed donut.',
    price: 50,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1585773501247-ed07f0cb2b12?w=800&h=600&fit=crop'
  },
  {
    id: 32,
    name: 'Donut - Chocolate',
    description: 'Chocolate glazed donut.',
    price: 60,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1585773501247-ed07f0cb2b12?w=800&h=600&fit=crop'
  },
  {
    id: 33,
    name: 'Donut - Sprinkles',
    description: 'Colorful sprinkled donut.',
    price: 60,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1585773501247-ed07f0cb2b12?w=800&h=600&fit=crop'
  },
  {
    id: 34,
    name: 'Bagel - Plain',
    description: 'Fresh plain bagel.',
    price: 65,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd13413?w=800&h=600&fit=crop'
  },
  {
    id: 35,
    name: 'Bagel - Everything',
    description: 'Bagel with everything seasoning.',
    price: 75,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd13413?w=800&h=600&fit=crop'
  },

  // Savory Food - Burgers (₹180-300)
  {
    id: 36,
    name: 'Classic Cheeseburger',
    description: 'Juicy beef patty with cheddar, lettuce, tomato, and house sauce.',
    price: 200,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
    tag: 'Best Seller'
  },
  {
    id: 37,
    name: 'Double Burger',
    description: 'Two beef patties with double cheese and fresh toppings.',
    price: 250,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop'
  },
  {
    id: 38,
    name: 'Bacon Cheeseburger',
    description: 'Juicy beef with crispy bacon and cheddar.',
    price: 220,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop'
  },
  {
    id: 39,
    name: 'Mushroom Swiss Burger',
    description: 'Beef patty with mushrooms and swiss cheese.',
    price: 210,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop'
  },
  {
    id: 40,
    name: 'Chicken Burger',
    description: 'Crispy chicken patty with fresh vegetables.',
    price: 180,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1562547256-ee5b2d89d1f8?w=800&h=600&fit=crop'
  },
  {
    id: 41,
    name: 'Veggie Burger',
    description: 'Plant-based patty with fresh toppings.',
    price: 160,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1585238341710-4abb8e50a69f?w=800&h=600&fit=crop'
  },

  // Pizza (₹250-400)
  {
    id: 42,
    name: 'Margherita Pizza',
    description: 'Fresh basil, mozzarella, and san marzano tomato sauce.',
    price: 280,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&h=600&fit=crop',
    tag: 'Recommended',
    sizes: [
      { name: 'small', label: 'S (6")', price: 180 },
      { name: 'medium', label: 'M (9")', price: 280 },
      { name: 'large', label: 'L (12")', price: 380 }
    ]
  },
  {
    id: 43,
    name: 'Pepperoni Pizza',
    description: 'Classic pepperoni with mozzarella cheese.',
    price: 320,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07f4ee?w=800&h=600&fit=crop',
    sizes: [
      { name: 'small', label: 'S (6")', price: 200 },
      { name: 'medium', label: 'M (9")', price: 320 },
      { name: 'large', label: 'L (12")', price: 420 }
    ]
  },
  {
    id: 44,
    name: 'Vegetarian Pizza',
    description: 'Bell peppers, onions, mushrooms, and olives.',
    price: 300,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1511689915489-a1a05b6c464b?w=800&h=600&fit=crop',
    sizes: [
      { name: 'small', label: 'S (6")', price: 190 },
      { name: 'medium', label: 'M (9")', price: 300 },
      { name: 'large', label: 'L (12")', price: 400 }
    ]
  },
  {
    id: 45,
    name: 'Four Cheese Pizza',
    description: 'Mozzarella, parmesan, ricotta, and gorgonzola.',
    price: 350,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1611689534306-591ba3dedff5?w=800&h=600&fit=crop',
    sizes: [
      { name: 'small', label: 'S (6")', price: 220 },
      { name: 'medium', label: 'M (9")', price: 350 },
      { name: 'large', label: 'L (12")', price: 450 }
    ]
  },
  {
    id: 46,
    name: 'BBQ Chicken Pizza',
    description: 'Grilled chicken, BBQ sauce, and red onions.',
    price: 330,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07f4ee?w=800&h=600&fit=crop',
    sizes: [
      { name: 'small', label: 'S (6")', price: 210 },
      { name: 'medium', label: 'M (9")', price: 330 },
      { name: 'large', label: 'L (12")', price: 430 }
    ]
  },
  // Sides (₹80-150)
  {
    id: 47,
    name: 'Truffle Fries',
    description: 'Crispy fries tossed with truffle oil and parmesan cheese.',
    price: 130,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1573080496987-a199f8cd4054?w=800&h=600&fit=crop'
  },
  {
    id: 48,
    name: 'Cheese Fries',
    description: 'Golden fries with melted cheese sauce.',
    price: 100,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1573080496987-a199f8cd4054?w=800&h=600&fit=crop'
  },
  {
    id: 49,
    name: 'Sweet Potato Fries',
    description: 'Crispy sweet potato fries with paprika.',
    price: 110,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop'
  },
  {
    id: 50,
    name: 'Spicy Chicken Wings',
    description: 'Crispy wings tossed in our signature spicy buffalo sauce.',
    price: 200,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&h=600&fit=crop'
  },
  {
    id: 51,
    name: 'BBQ Wings',
    description: 'Tender wings with BBQ glaze.',
    price: 200,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&h=600&fit=crop'
  },
  {
    id: 52,
    name: 'Garlic Parmesan Wings',
    description: 'Wings with garlic butter and parmesan.',
    price: 220,
    category: 'fast-food',
    image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&h=600&fit=crop'
  },

  // Sandwiches (₹150-250)
  {
    id: 53,
    name: 'Avocado Toast',
    description: 'Whole grain toast with fresh avocado and poached eggs.',
    price: 180,
    category: 'sandwich',
    image: 'https://images.unsplash.com/photo-1570521044498-a3fca1ae97f7?w=800&h=600&fit=crop'
  },
  {
    id: 54,
    name: 'Club Sandwich',
    description: 'Triple layered with turkey, bacon, and fresh vegetables.',
    price: 220,
    category: 'sandwich',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop'
  },
  {
    id: 55,
    name: 'Grilled Cheese',
    description: 'Classic grilled cheese with melted cheddar.',
    price: 120,
    category: 'sandwich',
    image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&h=600&fit=crop'
  },
  {
    id: 56,
    name: 'Tuna Sandwich',
    description: 'Fresh tuna salad with lettuce and tomato.',
    price: 170,
    category: 'sandwich',
    image: 'https://images.unsplash.com/photo-1511689915489-a1a05b6c464b?w=800&h=600&fit=crop'
  },
  {
    id: 57,
    name: 'Caprese Sandwich',
    description: 'Tomato, mozzarella, and basil with balsamic.',
    price: 160,
    category: 'sandwich',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop'
  },
  {
    id: 58,
    name: 'Turkey Sandwich',
    description: 'Sliced turkey with fresh vegetables and mayo.',
    price: 170,
    category: 'sandwich',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop'
  },

  // Desserts (₹100-250)
  {
    id: 59,
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with a molten center, served with vanilla ice cream.',
    price: 150,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&h=600&fit=crop',
    tag: 'Sweet Treat'
  },
  {
    id: 60,
    name: 'Cheesecake',
    description: 'Creamy and delicious New York style cheesecake.',
    price: 150,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1533134242443-742890cb7c14?w=800&h=600&fit=crop'
  },
  {
    id: 61,
    name: 'Strawberry Cheesecake',
    description: 'Creamy cheesecake topped with fresh strawberries.',
    price: 170,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1533134242443-742890cb7c14?w=800&h=600&fit=crop'
  },
  {
    id: 62,
    name: 'Tiramisu',
    description: 'Classic Italian dessert with mascarpone and espresso.',
    price: 140,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1571877227200-a0fb08d01a28?w=800&h=600&fit=crop'
  },
  {
    id: 63,
    name: 'Brownie',
    description: 'Fudgy chocolate brownie.',
    price: 80,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&h=600&fit=crop'
  },
  {
    id: 64,
    name: 'Chocolate Brownie Sundae',
    description: 'Warm brownie with ice cream and chocolate sauce.',
    price: 130,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&h=600&fit=crop'
  },
  {
    id: 65,
    name: 'Vanilla Cheesecake',
    description: 'Classic vanilla cheesecake.',
    price: 150,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1533134242443-742890cb7c14?w=800&h=600&fit=crop'
  },
  {
    id: 66,
    name: 'Fruit Tart',
    description: 'Crispy tart with custard and fresh fruits.',
    price: 140,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1568571933382-74d440642117?w=800&h=600&fit=crop'
  },
  {
    id: 67,
    name: 'Chocolate Mousse',
    description: 'Light and fluffy chocolate mousse.',
    price: 100,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop'
  },
  {
    id: 68,
    name: 'Panna Cotta',
    description: 'Italian cream dessert with berry compote.',
    price: 130,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1577080643272-265f434d3b83?w=800&h=600&fit=crop'
  },
  {
    id: 69,
    name: 'Chocolate Cake Slice',
    description: 'Rich triple chocolate cake.',
    price: 120,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop'
  },
  {
    id: 70,
    name: 'Carrot Cake',
    description: 'Moist carrot cake with cream cheese frosting.',
    price: 110,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop'
  },
  {
    id: 71,
    name: 'Lemon Tart',
    description: 'Tangy lemon tart with meringue topping.',
    price: 120,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1568571933382-74d440642117?w=800&h=600&fit=crop'
  },

  // Ice Cream & Cold Treats (₹60-120)
  {
    id: 72,
    name: 'Vanilla Ice Cream',
    description: 'Creamy classic vanilla ice cream.',
    price: 80,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop',
    sizes: [
      { name: 'single', label: '1 Scoop', price: 60 },
      { name: 'double', label: '2 Scoop', price: 100 }
    ]
  },
  {
    id: 73,
    name: 'Chocolate Ice Cream',
    description: 'Rich chocolate ice cream.',
    price: 80,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop',
    sizes: [
      { name: 'single', label: '1 Scoop', price: 60 },
      { name: 'double', label: '2 Scoop', price: 100 }
    ]
  },
  {
    id: 74,
    name: 'Strawberry Ice Cream',
    description: 'Fresh strawberry ice cream.',
    price: 80,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop',
    sizes: [
      { name: 'single', label: '1 Scoop', price: 60 },
      { name: 'double', label: '2 Scoop', price: 100 }
    ]
  },
  {
    id: 75,
    name: 'Mint Chocolate Chip',
    description: 'Refreshing mint with chocolate chunks.',
    price: 90,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop',
    sizes: [
      { name: 'single', label: '1 Scoop', price: 70 },
      { name: 'double', label: '2 Scoop', price: 110 }
    ]
  },
  {
    id: 76,
    name: 'Cookie Dough Ice Cream',
    description: 'Vanilla with chunks of cookie dough.',
    price: 100,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop',
    sizes: [
      { name: 'single', label: '1 Scoop', price: 80 },
      { name: 'double', label: '2 Scoop', price: 130 }
    ]
  },
  {
    id: 77,
    name: 'Pistachio Ice Cream',
    description: 'Creamy pistachio flavored ice cream.',
    price: 100,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop',
    sizes: [
      { name: 'single', label: '1 Scoop', price: 80 },
      { name: 'double', label: '2 Scoop', price: 130 }
    ]
  },
  {
    id: 78,
    name: 'Vanilla Milkshake',
    description: 'Classic vanilla milkshake.',
    price: 110,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1579954587989-a1f2c4c01bc8?w=800&h=600&fit=crop',
    sizes: [
      { name: 'regular', label: 'Regular', price: 100 },
      { name: 'large', label: 'Large', price: 140 }
    ]
  },
  {
    id: 79,
    name: 'Chocolate Milkshake',
    description: 'Rich chocolate milkshake.',
    price: 110,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1579954587989-a1f2c4c01bc8?w=800&h=600&fit=crop',
    sizes: [
      { name: 'regular', label: 'Regular', price: 100 },
      { name: 'large', label: 'Large', price: 140 }
    ]
  },
  {
    id: 80,
    name: 'Strawberry Milkshake',
    description: 'Fresh strawberry milkshake.',
    price: 110,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1579954587989-a1f2c4c01bc8?w=800&h=600&fit=crop',
    sizes: [
      { name: 'regular', label: 'Regular', price: 100 },
      { name: 'large', label: 'Large', price: 140 }
    ]
  },
  {
    id: 81,
    name: 'Cookies & Cream Shake',
    description: 'Milkshake with cookie crumbles.',
    price: 120,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1579954587989-a1f2c4c01bc8?w=800&h=600&fit=crop',
    sizes: [
      { name: 'regular', label: 'Regular', price: 110 },
      { name: 'large', label: 'Large', price: 150 }
    ]
  },

  // Smoothies & Juices (₹80-150)
  {
    id: 82,
    name: 'Mango Smoothie',
    description: 'Fresh mango with yogurt and ice.',
    price: 100,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1505252585461-04db1267ae5b?w=800&h=600&fit=crop',
    sizes: [
      { name: 'regular', label: 'Regular', price: 90 },
      { name: 'large', label: 'Large', price: 130 }
    ]
  },
  {
    id: 83,
    name: 'Berry Smoothie',
    description: 'Mixed berries with yogurt.',
    price: 100,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1505252585461-04db1267ae5b?w=800&h=600&fit=crop',
    sizes: [
      { name: 'regular', label: 'Regular', price: 90 },
      { name: 'large', label: 'Large', price: 130 }
    ]
  },
  {
    id: 84,
    name: 'Green Smoothie',
    description: 'Spinach, apple, and banana blend.',
    price: 110,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1505252585461-04db1267ae5b?w=800&h=600&fit=crop',
    sizes: [
      { name: 'regular', label: 'Regular', price: 100 },
      { name: 'large', label: 'Large', price: 140 }
    ]
  },
  {
    id: 85,
    name: 'Tropical Smoothie',
    description: 'Pineapple, mango, and coconut.',
    price: 110,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1505252585461-04db1267ae5b?w=800&h=600&fit=crop',
    sizes: [
      { name: 'regular', label: 'Regular', price: 100 },
      { name: 'large', label: 'Large', price: 140 }
    ]
  },
  {
    id: 86,
    name: 'Orange Juice',
    description: 'Fresh squeezed orange juice.',
    price: 80,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop'
  },
  {
    id: 87,
    name: 'Apple Juice',
    description: 'Fresh apple juice.',
    price: 70,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop'
  },
  {
    id: 88,
    name: 'Carrot Juice',
    description: 'Fresh vegetable carrot juice.',
    price: 70,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop'
  },
  {
    id: 89,
    name: 'Pomegranate Juice',
    description: 'Antioxidant-rich pomegranate juice.',
    price: 100,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop'
  },
  {
    id: 90,
    name: 'Watermelon Juice',
    description: 'Refreshing watermelon juice.',
    price: 80,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop'
  },

  // Salads (₹150-220)
  {
    id: 91,
    name: 'Caesar Salad',
    description: 'Romaine lettuce, croutons, parmesan, and Caesar dressing.',
    price: 160,
    category: 'salad',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'
  },
  {
    id: 92,
    name: 'Greek Salad',
    description: 'Tomato, cucumber, feta, and olives.',
    price: 170,
    category: 'salad',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop'
  },
  {
    id: 93,
    name: 'Garden Salad',
    description: 'Mixed greens with fresh vegetables.',
    price: 140,
    category: 'salad',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'
  },
  {
    id: 94,
    name: 'Chicken Caesar Salad',
    description: 'Caesar salad with grilled chicken.',
    price: 200,
    category: 'salad',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'
  },
  {
    id: 95,
    name: 'Caprese Salad',
    description: 'Tomato, mozzarella, basil, and balsamic.',
    price: 160,
    category: 'salad',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop'
  },
  {
    id: 96,
    name: 'Quinoa Salad',
    description: 'Protein-rich quinoa with vegetables.',
    price: 180,
    category: 'salad',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'
  },
  {
    id: 97,
    name: 'Spinach Salad',
    description: 'Fresh spinach with berries and nuts.',
    price: 170,
    category: 'salad',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop'
  },
  {
    id: 98,
    name: 'Beet Salad',
    description: 'Roasted beets with goat cheese.',
    price: 180,
    category: 'salad',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop'
  },
  {
    id: 99,
    name: 'Niçoise Salad',
    description: 'Tuna, egg, olives, and potatoes.',
    price: 210,
    category: 'salad',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'
  },
  {
    id: 100,
    name: 'Grilled Vegetable Salad',
    description: 'Mixed grilled vegetables with herbs.',
    price: 170,
    category: 'salad',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop'
  }
];
 