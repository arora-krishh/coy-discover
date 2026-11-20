// Generates src/data/profiles.json (36 mock profiles). Run: npm run seed
// `likesMe: true` marks profiles that have ALREADY liked the logged-in user.
// That flag is INTERNAL: it is never sent to the client (see discoveryService.toPublic).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const people = [
  ['Aarav', 22, 'IIT Delhi'], ['Ananya', 21, 'Miranda House'], ['Ishaan', 23, 'Delhi University'],
  ['Meera', 20, "St. Stephen's College"], ['Kabir', 24, 'Gurugram'], ['Riya', 22, 'Lady Shri Ram College'],
  ['Vihaan', 21, 'DTU'], ['Saanvi', 25, 'South Delhi'], ['Arjun', 23, 'SRCC'],
  ['Diya', 20, 'Jamia Millia Islamia'], ['Rohan', 26, 'Noida'], ['Tara', 22, 'Hindu College'],
  ['Aditya', 24, 'NSUT'], ['Naina', 21, 'Ashoka University'], ['Dev', 23, 'IIIT Delhi'],
  ['Kiara', 22, 'Hansraj College'], ['Reyansh', 25, 'Gurugram'], ['Myra', 19, 'Amity University Noida'],
  ['Yash', 22, 'JNU'], ['Zoya', 24, 'Saket, Delhi'], ['Neel', 21, 'Shiv Nadar University'],
  ['Anika', 23, 'Dwarka, Delhi'], ['Kunal', 27, 'Gurugram'], ['Sana', 22, 'Jamia Millia Islamia'],
  ['Ayaan', 20, 'Delhi University'], ['Ira', 21, 'Miranda House'], ['Manav', 24, 'IIT Delhi'],
  ['Prisha', 23, 'Noida'], ['Samar', 25, 'Faridabad'], ['Tanvi', 22, 'Kamala Nehru College'],
  ['Veer', 26, 'South Delhi'], ['Mehak', 21, 'Gargi College'], ['Harsh', 23, 'DTU'],
  ['Nisha', 24, 'Gurugram'], ['Rudra', 22, 'Hindu College'], ['Simran', 20, 'Lady Shri Ram College'],
];

const interests = [
  'Filmmaking', 'Street food', 'Indie music', 'Football', 'Chess', 'Photography', 'Hiking', 'Stand-up comedy',
  'Poetry', 'Gaming', 'Cricket', 'Cooking', 'Travel', 'Anime', 'Yoga', 'Podcasts', 'Painting', 'Coffee',
  'Dance', 'Startups', 'Cycling', 'Book clubs', 'Badminton', 'Thrifting',
];

const bios = [
  'Will rate your playlist honestly. Chai over coffee, always.',
  'Weekend plan: find the best momos in the city and defend my choice.',
  'Part-time overthinker, full-time snack enthusiast.',
  'Sunrise walks, sunset debates. Ask me about my film list.',
  'I can parallel park and recite every dialogue from Jab We Met.',
  'Looking for someone to split a dessert and a bad movie with.',
  'Trying to read more, mostly collecting bookmarks.',
  'My camera roll is 80% food and 20% sky.',
  'Probably late, but I will bring snacks.',
  'Learning guitar. Neighbours are being very patient.',
  'Metro rides and long voice notes are my love language.',
  'Good at quizzes, terrible at deciding where to eat.',
  'Believer in second breakfasts and spontaneous road trips.',
  'Ask me about the time I got lost in Hauz Khas. Twice.',
  'Gym at 6am, memes at 6:05am.',
  'Always up for a late-night Maggi and a deep chat.',
  'Collecting sunsets, thrifted jackets and good conversations.',
  'Competitive at board games. Friendly about it, mostly.',
];

const profiles = people.map(([name, age, place], i) => ({
  id: `p${String(i + 1).padStart(2, '0')}`,
  name,
  age,
  photo: `/api/avatars/p${String(i + 1).padStart(2, '0')}.svg`,
  bio: bios[i % bios.length],
  place,
  interests: [0, 7, 14].map((k) => interests[(i * 5 + k) % interests.length]),
  likesMe: i % 3 === 0, // 12 of 36 profiles have already liked you
}));

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'profiles.json');
fs.writeFileSync(out, JSON.stringify(profiles, null, 2) + '\n');
console.log(`Wrote ${profiles.length} profiles (${profiles.filter((p) => p.likesMe).length} already like you) -> ${out}`);
