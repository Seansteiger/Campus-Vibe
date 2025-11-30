import { PrismaClient, VerificationType, Visibility, MediaType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create universities
  const universities = await Promise.all([
    prisma.university.create({
      data: {
        name: 'University of the Witwatersrand',
        province: 'Gauteng',
        domains: ['wits.ac.za', 'students.wits.ac.za'],
        logoUrl: 'https://example.com/wits-logo.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'University of Cape Town',
        province: 'Western Cape',
        domains: ['uct.ac.za', 'myuct.ac.za'],
        logoUrl: 'https://example.com/uct-logo.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'University of Pretoria',
        province: 'Gauteng',
        domains: ['up.ac.za', 'tuks.co.za'],
        logoUrl: 'https://example.com/up-logo.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'University of KwaZulu-Natal',
        province: 'KwaZulu-Natal',
        domains: ['ukzn.ac.za'],
        logoUrl: 'https://example.com/ukzn-logo.png',
      },
    }),
    prisma.university.create({
      data: {
        name: 'Stellenbosch University',
        province: 'Western Cape',
        domains: ['sun.ac.za', 'maties.com'],
        logoUrl: 'https://example.com/sun-logo.png',
      },
    }),
  ]);

  console.log(`✅ Created ${universities.length} universities`);

  // Create campuses (3 per university)
  const campuses: Awaited<ReturnType<typeof prisma.campus.create>>[] = [];
  const campusData = [
    // Wits
    { name: 'Braamfontein Campus East', lat: -26.1929, lng: 28.0305, address: '1 Jan Smuts Ave, Braamfontein, Johannesburg' },
    { name: 'Braamfontein Campus West', lat: -26.1892, lng: 28.0255, address: 'Jorissen St, Braamfontein, Johannesburg' },
    { name: 'Medical Campus', lat: -26.1747, lng: 28.0344, address: 'York Rd, Parktown, Johannesburg' },
    // UCT
    { name: 'Upper Campus', lat: -33.9575, lng: 18.4614, address: 'Rondebosch, Cape Town' },
    { name: 'Middle Campus', lat: -33.9607, lng: 18.4606, address: 'Rondebosch, Cape Town' },
    { name: 'Health Sciences', lat: -33.9405, lng: 18.4667, address: 'Observatory, Cape Town' },
    // UP
    { name: 'Hatfield Campus', lat: -25.7545, lng: 28.2314, address: 'Lynnwood Rd, Hatfield, Pretoria' },
    { name: 'Groenkloof Campus', lat: -25.7780, lng: 28.2120, address: 'George Storrar Dr, Groenkloof, Pretoria' },
    { name: 'Mamelodi Campus', lat: -25.7167, lng: 28.3839, address: 'Hans Strijdom Dr, Mamelodi East, Pretoria' },
    // UKZN
    { name: 'Howard College', lat: -29.8671, lng: 30.9803, address: 'King George V Ave, Glenwood, Durban' },
    { name: 'Westville Campus', lat: -29.8197, lng: 30.9425, address: 'University Rd, Westville, Durban' },
    { name: 'Pietermaritzburg Campus', lat: -29.6253, lng: 30.4031, address: 'King Edward Ave, Scottsville, Pietermaritzburg' },
    // Stellenbosch
    { name: 'Main Campus', lat: -33.9321, lng: 18.8602, address: 'Victoria St, Stellenbosch' },
    { name: 'Engineering Campus', lat: -33.9299, lng: 18.8655, address: 'Banghoek Rd, Stellenbosch' },
    { name: 'Tygerberg Campus', lat: -33.9587, lng: 18.6089, address: 'Francie van Zijl Dr, Parow' },
  ];

  for (let i = 0; i < universities.length; i++) {
    for (let j = 0; j < 3; j++) {
      const data = campusData[i * 3 + j];
      const campus = await prisma.campus.create({
        data: {
          ...data,
          universityId: universities[i].id,
        },
      });
      campuses.push(campus);
    }
  }

  console.log(`✅ Created ${campuses.length} campuses`);

  // Create programs
  const programs: Awaited<ReturnType<typeof prisma.program.create>>[] = [];
  const programNames = [
    'Computer Science',
    'Software Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Business Administration',
    'Law',
    'Medicine',
    'Psychology',
    'Architecture',
    'Data Science',
  ];

  for (const university of universities) {
    for (const programName of programNames) {
      const program = await prisma.program.create({
        data: {
          name: programName,
          code: programName.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000),
          universityId: university.id,
        },
      });
      programs.push(program);
    }
  }

  console.log(`✅ Created ${programs.length} programs`);

  // Create accepted domains
  await prisma.acceptedDomain.createMany({
    data: [
      { domain: 'wits.ac.za' },
      { domain: 'students.wits.ac.za' },
      { domain: 'uct.ac.za' },
      { domain: 'myuct.ac.za' },
      { domain: 'up.ac.za' },
      { domain: 'tuks.co.za' },
      { domain: 'ukzn.ac.za' },
      { domain: 'sun.ac.za' },
      { domain: 'maties.com' },
    ],
  });

  console.log('✅ Created accepted domains');

  // Create users (20 sample users)
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const users: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
  
  const firstNames = ['Thabo', 'Naledi', 'Sipho', 'Lindiwe', 'Bongani', 'Zinhle', 'Kagiso', 'Lerato', 'Mpho', 'Nomvula',
                      'Trevor', 'Jessica', 'David', 'Sarah', 'Michael', 'Emma', 'James', 'Olivia', 'William', 'Sophia'];
  const lastNames = ['Molefe', 'Ndlovu', 'Khumalo', 'Dlamini', 'Nkosi', 'Zulu', 'Mabaso', 'Sithole', 'Mahlangu', 'Mokoena',
                     'Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'];
  
  const interests = ['coding', 'music', 'sports', 'photography', 'art', 'travel', 'gaming', 'reading', 'cooking', 'fitness'];

  for (let i = 0; i < 20; i++) {
    const universityIndex = i % universities.length;
    const campusIndex = universityIndex * 3 + (i % 3);
    const programIndex = universityIndex * 10 + (i % 10);
    
    const user = await prisma.user.create({
      data: {
        email: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@${universities[universityIndex].domains[0]}`,
        passwordHash,
        displayName: `${firstNames[i]} ${lastNames[i]}`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstNames[i]}${lastNames[i]}`,
        universityId: universities[universityIndex].id,
        campusId: campuses[campusIndex].id,
        programId: programs[programIndex].id,
        year: (i % 4) + 1,
        verified: i < 15, // First 15 users are verified
        verificationType: i < 15 ? VerificationType.EMAIL : null,
        bio: `Student at ${universities[universityIndex].name}. Passionate about ${interests[i % interests.length]} and ${interests[(i + 3) % interests.length]}.`,
        interests: [interests[i % interests.length], interests[(i + 3) % interests.length], interests[(i + 5) % interests.length]],
        role: i === 0 ? 'ADMIN' : i === 1 ? 'MODERATOR' : 'USER',
      },
    });
    users.push(user);
  }

  console.log(`✅ Created ${users.length} users`);

  // Create posts (50 sample posts)
  const posts: Awaited<ReturnType<typeof prisma.post.create>>[] = [];
  const postContents = [
    'Just aced my Computer Science exam! 🎉 Hard work pays off!',
    'Anyone else struggling with this assignment? Let me know if you want to form a study group.',
    'The campus library is so peaceful this time of night. Perfect for studying. 📚',
    'Can we talk about how amazing the new sports facility is?! 🏋️',
    'Looking for notes from yesterday\'s lecture. Can anyone help?',
    'Coffee ☕ + studying = survival mode activated',
    'Just submitted my thesis proposal! One step closer to graduation! 🎓',
    'Who else is excited for the upcoming campus festival?',
    'The sunset from the university grounds today was absolutely breathtaking! 🌅',
    'Pro tip: The cafeteria has the best food on Wednesdays. Trust me.',
    'Study break at the campus cafe. Who wants to join?',
    'Finally finished my group project! Teamwork makes the dream work! 💪',
    'Looking for internship opportunities in tech. Any recommendations?',
    'The campus tour for new students was so nostalgic. Remember your first day?',
    'Mental health check-in: Take breaks, stay hydrated, and reach out if you need support. 💙',
    'Just got accepted for the exchange program! Can\'t believe it! ✈️',
    'Anyone interested in joining the coding club? We meet every Tuesday!',
    'The professor\'s jokes in today\'s lecture were actually funny 😂',
    'Counting down to semester break! Who else needs a vacation?',
    'Just discovered a quiet study spot in the engineering building. Game changer!',
  ];

  const visibilities: Visibility[] = [Visibility.CAMPUS, Visibility.UNIVERSITY, Visibility.PROVINCE, Visibility.NATIONAL];

  for (let i = 0; i < 50; i++) {
    const userIndex = i % users.length;
    const post = await prisma.post.create({
      data: {
        authorId: users[userIndex].id,
        content: postContents[i % postContents.length],
        isAcademic: i % 5 === 0, // Every 5th post is academic
        campusId: users[userIndex].campusId,
        universityId: users[userIndex].universityId,
        province: universities[userIndex % universities.length].province,
        visibility: visibilities[i % visibilities.length],
        tags: i % 3 === 0 ? ['study', 'campus-life'] : ['general'],
        viewCount: Math.floor(Math.random() * 100),
      },
    });
    posts.push(post);
  }

  console.log(`✅ Created ${posts.length} posts`);

  // Create some media for posts
  for (let i = 0; i < 20; i++) {
    await prisma.media.create({
      data: {
        postId: posts[i].id,
        url: `https://picsum.photos/seed/${i}/800/600`,
        mime: 'image/jpeg',
        type: MediaType.IMAGE,
        width: 800,
        height: 600,
      },
    });
  }

  console.log('✅ Created media for posts');

  // Create follows
  for (let i = 0; i < users.length; i++) {
    // Each user follows 3-5 other users
    const numFollows = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numFollows; j++) {
      const followeeIndex = (i + j + 1) % users.length;
      if (followeeIndex !== i) {
        await prisma.follow.create({
          data: {
            followerId: users[i].id,
            followeeId: users[followeeIndex].id,
          },
        }).catch(() => {}); // Ignore duplicates
      }
    }
  }

  console.log('✅ Created follows');

  // Create likes
  for (let i = 0; i < posts.length; i++) {
    const numLikes = Math.floor(Math.random() * 10);
    for (let j = 0; j < numLikes; j++) {
      const userIndex = (i + j) % users.length;
      await prisma.like.create({
        data: {
          userId: users[userIndex].id,
          postId: posts[i].id,
        },
      }).catch(() => {}); // Ignore duplicates
    }
  }

  console.log('✅ Created likes');

  // Create comments
  const comments = [
    'Great post!',
    'I totally agree with this!',
    'Thanks for sharing!',
    'This is so helpful!',
    'Can you tell me more about this?',
    '🔥🔥🔥',
    'Same here!',
    'Good luck!',
    'Well said!',
    'Love this!',
  ];

  for (let i = 0; i < 100; i++) {
    const postIndex = i % posts.length;
    const userIndex = (i + 3) % users.length;
    await prisma.comment.create({
      data: {
        userId: users[userIndex].id,
        postId: posts[postIndex].id,
        content: comments[i % comments.length],
      },
    });
  }

  console.log('✅ Created comments');

  // Create opportunities
  const opportunities = [
    {
      title: 'NSFAS Bursary 2024',
      description: 'Financial aid for South African students from low-income households. Covers tuition, accommodation, and living expenses.',
      sourceUrl: 'https://www.nsfas.org.za',
      fieldTags: ['all-fields'],
      yearMin: 1,
      yearMax: 4,
      provider: 'National Student Financial Aid Scheme',
      type: 'bursary',
      provinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal'],
    },
    {
      title: 'Google Software Engineering Internship',
      description: 'Join Google as a software engineering intern and work on real products used by millions.',
      sourceUrl: 'https://careers.google.com',
      fieldTags: ['computer-science', 'software-engineering'],
      yearMin: 3,
      yearMax: 4,
      provider: 'Google',
      type: 'internship',
      provinces: ['Gauteng'],
    },
    {
      title: 'Sasol Bursary Scheme',
      description: 'Full bursary for engineering and science students. Includes vacation work opportunities.',
      sourceUrl: 'https://www.sasol.com/careers/bursaries',
      fieldTags: ['engineering', 'science'],
      yearMin: 1,
      yearMax: 4,
      provider: 'Sasol',
      type: 'bursary',
      provinces: ['Gauteng', 'Mpumalanga'],
    },
    {
      title: 'Standard Bank Graduate Programme',
      description: 'A 12-month graduate programme for finance and business graduates.',
      sourceUrl: 'https://www.standardbank.com/careers',
      fieldTags: ['finance', 'business', 'economics'],
      yearMin: 4,
      yearMax: 4,
      provider: 'Standard Bank',
      type: 'internship',
      provinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal'],
    },
    {
      title: 'Discovery Health Internship',
      description: 'Healthcare internship programme for medical and health science students.',
      sourceUrl: 'https://www.discovery.co.za/careers',
      fieldTags: ['medicine', 'health-sciences'],
      yearMin: 4,
      yearMax: 6,
      provider: 'Discovery Health',
      type: 'internship',
      provinces: ['Gauteng'],
    },
  ];

  for (const opp of opportunities) {
    await prisma.opportunity.create({
      data: {
        ...opp,
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      },
    });
  }

  console.log(`✅ Created ${opportunities.length} opportunities`);

  // Create some events
  const events = [
    {
      title: 'Campus Welcome Day 2024',
      description: 'Welcome new students to campus with tours, activities, and free food!',
    },
    {
      title: 'Tech Career Fair',
      description: 'Meet top tech companies and explore internship opportunities.',
    },
    {
      title: 'Study Skills Workshop',
      description: 'Learn effective study techniques and time management skills.',
    },
  ];

  for (let i = 0; i < events.length; i++) {
    await prisma.event.create({
      data: {
        ...events[i],
        startAt: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        campusId: campuses[i].id,
        createdBy: users[0].id,
        tags: ['campus-event'],
      },
    });
  }

  console.log(`✅ Created ${events.length} events`);

  // Create some reports for moderation
  await prisma.report.createMany({
    data: [
      {
        reporterId: users[5].id,
        postId: posts[10].id,
        reason: 'SPAM',
        details: 'This post seems like spam advertising.',
      },
      {
        reporterId: users[8].id,
        postId: posts[25].id,
        reason: 'INAPPROPRIATE',
        details: 'Inappropriate content for campus environment.',
      },
      {
        reporterId: users[12].id,
        postId: posts[35].id,
        reason: 'MISINFORMATION',
        details: 'This information is factually incorrect.',
      },
    ],
  });

  console.log('✅ Created sample reports for moderation');

  // Create some chat and messages
  const chat = await prisma.chat.create({
    data: {
      isGroup: false,
      members: {
        create: [
          { userId: users[0].id },
          { userId: users[1].id },
        ],
      },
    },
  });

  await prisma.message.createMany({
    data: [
      { chatId: chat.id, senderId: users[0].id, content: 'Hey, how are you?' },
      { chatId: chat.id, senderId: users[1].id, content: 'I\'m good! Just finished studying.' },
      { chatId: chat.id, senderId: users[0].id, content: 'Nice! Want to grab coffee later?' },
      { chatId: chat.id, senderId: users[1].id, content: 'Sure! See you at the cafeteria at 3pm?' },
      { chatId: chat.id, senderId: users[0].id, content: 'Perfect! See you then! ☕' },
    ],
  });

  console.log('✅ Created sample chat and messages');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
