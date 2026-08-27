export const initialData = {
  users: [
    {
      id: 'usr_1',
      name: 'Aarav Sharma',
      email: 'aarav@example.com',
      password: 'password123',
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
      createdAt: '2026-06-15T10:00:00Z'
    },
    {
      id: 'usr_2',
      name: 'Ananya Verma',
      email: 'ananya@example.com',
      password: 'password123',
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      createdAt: '2026-06-16T11:30:00Z'
    },
    {
      id: 'usr_3',
      name: 'Rohan Mehta',
      email: 'rohan@example.com',
      password: 'password123',
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      createdAt: '2026-06-18T14:15:00Z'
    },
    {
      id: 'usr_4',
      name: 'Priya Sundaram',
      email: 'priya@example.com',
      password: 'password123',
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      createdAt: '2026-06-20T09:00:00Z'
    },
    {
      id: 'usr_admin',
      name: 'System Admin',
      email: 'admin@roomiesync.com',
      password: 'adminpassword',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
      createdAt: '2026-01-01T00:00:00Z'
    }
  ],
  profiles: [
    {
      userId: 'usr_1',
      budget: [12000, 22000],
      occupation: 'Software Engineer @ TechCorp',
      foodPref: 'Veg',
      sleepSchedule: 'Early Bird (10 PM - 6 AM)',
      cleanliness: 5,
      smokingDrinking: 'Non-Smoker / Non-Drinker',
      hobbies: ['Coding', 'Badminton', 'Reading', 'Gaming'],
      preferredLocation: 'Koramangala / Indiranagar, Bangalore',
      bio: 'Clean, quiet techie looking for a like-minded roommate who values peace, hygiene, and occasional gaming sessions!'
    },
    {
      userId: 'usr_2',
      budget: [15000, 25000],
      occupation: 'Product Designer @ StartupX',
      foodPref: 'Veg',
      sleepSchedule: 'Flexible',
      cleanliness: 4,
      smokingDrinking: 'Non-Smoker / Social Drinker',
      hobbies: ['Design', 'Yoga', 'Cooking', 'Music'],
      preferredLocation: 'HSR Layout, Bangalore',
      bio: 'Creative soul who loves neat spaces, good coffee, and wholesome home-cooked meals.'
    },
    {
      userId: 'usr_3',
      budget: [10000, 18000],
      occupation: 'Data Analyst',
      foodPref: 'Non-Veg',
      sleepSchedule: 'Night Owl (1 AM - 8 AM)',
      cleanliness: 4,
      smokingDrinking: 'Social Smoker / Social Drinker',
      hobbies: ['Football', 'Guitar', 'Podcasts'],
      preferredLocation: 'BTM Layout, Bangalore',
      bio: 'Easy-going analyst into sports and weekend jams. Looking for a laid-back housemate!'
    },
    {
      userId: 'usr_4',
      budget: [14000, 20000],
      occupation: 'Marketing Specialist',
      foodPref: 'Vegan',
      sleepSchedule: 'Early Bird',
      cleanliness: 5,
      smokingDrinking: 'Non-Smoker / Non-Drinker',
      hobbies: ['Trekking', 'Photography', 'Gardening'],
      preferredLocation: 'Whitefield, Bangalore',
      bio: 'Eco-conscious, super organized person searching for a calm, friendly roomie.'
    }
  ],
  matches: [
    {
      id: 'req_101',
      fromUserId: 'usr_2',
      toUserId: 'usr_1',
      status: 'pending',
      createdAt: '2026-07-20T12:00:00Z'
    }
  ],
  properties: [
    {
      id: 'prop_1',
      title: 'Luxury 3BHK Glassmorphic Shared Flat',
      description: 'Fully furnished, high-speed WiFi, modern kitchen, power backup, gym access, and daily cleaning service included.',
      price: 18000,
      location: 'Koramangala 4th Block, Bangalore',
      type: 'Flat',
      sharingType: 'Private Room in 3BHK',
      amenities: ['WiFi', 'AC', 'Washing Machine', 'Housekeeping', 'Gym', 'Balcony'],
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
      ],
      ownerName: 'Vikram Sethi',
      ownerContact: '+91 98765 43210',
      status: 'verified'
    },
    {
      id: 'prop_2',
      title: 'Premium Co-Living PG for Tech Professionals',
      description: 'Spacious double-sharing room with attach bath, 3-time gourmet meals, gaming room, study lounge, and biometric security.',
      price: 13500,
      location: 'HSR Layout Sector 1, Bangalore',
      type: 'PG',
      sharingType: 'Twin Sharing',
      amenities: ['3 Meals Daily', 'WiFi', 'Power Backup', 'Biometric Lock', 'Gaming Room'],
      images: [
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'
      ],
      ownerName: 'Stanza Co-Living',
      ownerContact: '+91 98111 22233',
      status: 'verified'
    },
    {
      id: 'prop_3',
      title: 'Minimalist 2BHK Sunlit Apartment',
      description: 'Beautiful balcony views, wooden flooring, close to metro station and tech parks.',
      price: 16000,
      location: 'Indiranagar 100ft Road, Bangalore',
      type: 'Flat',
      sharingType: 'Single Bedroom',
      amenities: ['Near Metro', 'Modular Kitchen', 'AC', 'Security 24/7'],
      images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
      ],
      ownerName: 'Rajesh Kumar',
      ownerContact: '+91 97777 88899',
      status: 'verified'
    }
  ],
  bookings: [
    {
      id: 'book_1',
      propertyId: 'prop_1',
      userId: 'usr_1',
      date: '2026-07-28',
      status: 'Confirmed'
    }
  ],
  mealPlans: [
    {
      id: 'meal_1',
      providerName: 'Annapurna Home Kitchen',
      chefName: 'Chef Sunita Sharma',
      rating: 4.8,
      reviewCount: 42,
      cuisine: 'North & South Indian Wholesome Thali',
      weeklyPrice: 1200,
      monthlyPrice: 4200,
      dietary: 'Pure Veg',
      weeklyMenu: {
        Monday: 'Dal Tadka, Paneer Butter Masala, Roti, Rice, Salad',
        Tuesday: 'Rajma Chawal, Aloo Gobi, Phulka, Boondi Raita',
        Wednesday: 'Chole Masala, Mixed Veg, Puri/Roti, Jeera Rice',
        Thursday: 'Kadhi Pakoda, Bhindi Fry, Rice, Roti, Sweet',
        Friday: 'Special Veg Biryani, Mirchi Salan, Raita, Gulab Jamun'
      },
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'meal_2',
      providerName: 'FitByte Healthy Meals',
      chefName: 'Nutritionist Rahul Varma',
      rating: 4.9,
      reviewCount: 58,
      cuisine: 'High-Protein & Low-Carb Meal Prep',
      weeklyPrice: 1600,
      monthlyPrice: 5800,
      dietary: 'Veg & Non-Veg Options',
      weeklyMenu: {
        Monday: 'Grilled Chicken / Tofu Salad, Quinoa Bowl, Fruit Parfait',
        Tuesday: 'Egg White / Paneer Wrap, Sweet Potato Wedges, Protein Shake',
        Wednesday: 'Steamed Fish / Soya Chunk Curry, Brown Rice, Steamed Veggies'
      },
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80'
    }
  ],
  subscriptions: [
    {
      id: 'sub_1',
      planId: 'meal_1',
      userId: 'usr_1',
      duration: 'Monthly',
      status: 'Active',
      startDate: '2026-07-01'
    }
  ],
  agreements: [
    {
      id: 'agr_1',
      roommate1Name: 'Aarav Sharma',
      roommate2Name: 'Ananya Verma',
      propertyAddress: 'Flat 302, Palm Grove Heights, Koramangala, Bangalore',
      totalRent: 36000,
      roommate1Share: 50,
      roommate2Share: 50,
      securityDeposit: 100000,
      houseRules: [
        'No loud noise after 11:00 PM',
        'Maintain kitchen cleanliness after cooking',
        'Guests allowed with prior 24h notice',
        'Shared utility bills paid by 5th of every month'
      ],
      status: 'Approved & Signed',
      createdAt: '2026-07-10'
    }
  ],
  expenses: [
    {
      id: 'exp_1',
      title: 'July Flat Rent',
      amount: 36000,
      category: 'Rent',
      paidBy: 'Aarav Sharma',
      splitBetween: ['Aarav Sharma', 'Ananya Verma'],
      status: 'Settled',
      date: '2026-07-01'
    },
    {
      id: 'exp_2',
      title: 'WiFi & High-Speed Fiber Internet',
      amount: 1499,
      category: 'Utilities',
      paidBy: 'Ananya Verma',
      splitBetween: ['Aarav Sharma', 'Ananya Verma'],
      status: 'Pending',
      date: '2026-07-15'
    },
    {
      id: 'exp_3',
      title: 'Weekly Organic Grocery Stockup',
      amount: 3200,
      category: 'Groceries',
      paidBy: 'Aarav Sharma',
      splitBetween: ['Aarav Sharma', 'Ananya Verma'],
      status: 'Pending',
      date: '2026-07-21'
    }
  ],
  reviews: [
    {
      id: 'rev_1',
      targetType: 'user',
      targetId: 'usr_1',
      authorName: 'Ananya Verma',
      rating: 5,
      comment: 'Aarav is an exceptionally responsible and clean flatmate. Always pays bills on time and respects personal space!',
      createdAt: '2026-07-18'
    },
    {
      id: 'rev_2',
      targetType: 'property',
      targetId: 'prop_1',
      authorName: 'Rohan Mehta',
      rating: 4.8,
      comment: 'Superb apartment with great natural sunlight and top-notch amenities. Landlord is very cooperative.',
      createdAt: '2026-07-12'
    }
  ],
  notifications: [
    {
      id: 'notif_1',
      recipientId: 'usr_1',
      title: 'Match Request Received',
      message: 'Ananya Verma sent you a roommate match request with a 92% lifestyle compatibility score!',
      type: 'match',
      isRead: false,
      createdAt: '2026-07-23T10:00:00Z'
    },
    {
      id: 'notif_2',
      recipientId: 'usr_1',
      title: 'Expense Reminder',
      message: 'Ananya added WiFi Bill (₹1,499). Your share is ₹749.50.',
      type: 'expense',
      isRead: true,
      createdAt: '2026-07-22T14:30:00Z'
    }
  ],
  reports: [
    {
      id: 'rep_1',
      targetUserId: 'usr_fake99',
      reportedBy: 'Aarav Sharma',
      reason: 'Suspicious profile with duplicate stock images and unresponsive chat.',
      status: 'Under Review',
      createdAt: '2026-07-19'
    }
  ]
};
