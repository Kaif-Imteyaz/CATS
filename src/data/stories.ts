export interface PatientStory {
  id: string;
  name: string;
  age: number;
  condition: string;
  title: string;
  summary: string;
  fullStory: string;
  imageUrl?: string;
  beforeStats: {
    painLevel: number;
    mobility: number;
    sessionsPerWeek: number;
  };
  afterStats: {
    painLevel: number;
    mobility: number;
    sessionsPerWeek: number;
  };
  duration: string;
  audioUrl?: string;
}

export interface MotivationalQuote {
  id: string;
  text: string;
  author: string;
  category: 'health' | 'persistence' | 'strength' | 'recovery';
}

export const patientStories: PatientStory[] = [
  {
    id: '1',
    name: 'Maria Garcia',
    age: 54,
    condition: 'Lower Back Pain',
    title: 'From Chronic Pain to Pain-Free Living',
    summary: 'After 10 years of chronic lower back pain, Maria found relief through consistent physiotherapy.',
    fullStory: `I had been living with chronic lower back pain for over 10 years. Simple tasks like bending to pick up groceries or playing with my grandchildren became impossible. I tried everything - medications, massages, even considered surgery.

Then my doctor recommended this app. I was skeptical at first, but the guided exercises were so gentle and the voice coach made me feel like I had a personal trainer. Within 3 months, I noticed significant improvement.

Now, a year later, I can do things I never thought possible again. I play with my grandchildren, garden for hours, and even started dancing salsa again! The key was consistency - just 15 minutes a day changed my life.`,
    beforeStats: { painLevel: 8, mobility: 30, sessionsPerWeek: 0 },
    afterStats: { painLevel: 2, mobility: 85, sessionsPerWeek: 5 },
    duration: '12 months',
  },
  {
    id: '2',
    name: 'James Wilson',
    age: 67,
    condition: 'Post-Surgery Recovery',
    title: 'Knee Replacement Recovery Champion',
    summary: 'James recovered faster than expected after his knee replacement surgery.',
    fullStory: `At 67, I needed a total knee replacement. My surgeon told me recovery would be tough and could take up to a year to fully regain mobility. I was prepared for a long journey.

What I was not prepared for was how effective guided home exercises could be. The app tracked my progress, reminded me to do my exercises, and the voice coach spoke in my native Hindi, which made everything feel so personal.

My surgeon was amazed at my 3-month checkup. I was already walking without a cane, and my range of motion was better than patients who were 6 months post-surgery. The secret? Never missing a session and trusting the process.`,
    beforeStats: { painLevel: 9, mobility: 10, sessionsPerWeek: 0 },
    afterStats: { painLevel: 1, mobility: 90, sessionsPerWeek: 6 },
    duration: '6 months',
  },
  {
    id: '3',
    name: 'Sarah Chen',
    age: 42,
    condition: 'Desk Worker Posture',
    title: 'Reversing 15 Years of Desk Damage',
    summary: 'Sarah fixed her posture and eliminated neck pain caused by years of office work.',
    fullStory: `Working as a software developer for 15 years took its toll on my body. I had constant neck pain, rounded shoulders, and frequent headaches. I thought this was just part of aging and working at a desk.

A colleague recommended this app, and I started with just the shoulder circles and cat-cow stretches. The video demonstrations were incredibly helpful - I could see exactly what I was doing wrong.

After 4 months of consistent practice, my neck pain disappeared. My colleagues noticed my improved posture. Even my productivity improved because I was not constantly distracted by pain. Best decision I ever made for my health.`,
    beforeStats: { painLevel: 6, mobility: 50, sessionsPerWeek: 0 },
    afterStats: { painLevel: 0, mobility: 95, sessionsPerWeek: 7 },
    duration: '4 months',
  },
];

export const motivationalQuotes: MotivationalQuote[] = [
  { id: '1', text: 'The body achieves what the mind believes.', author: 'Napoleon Hill', category: 'strength' },
  { id: '2', text: 'Take care of your body. It is the only place you have to live.', author: 'Jim Rohn', category: 'health' },
  { id: '3', text: 'Strength does not come from physical capacity. It comes from an indomitable will.', author: 'Mahatma Gandhi', category: 'strength' },
  { id: '4', text: 'The greatest wealth is health.', author: 'Virgil', category: 'health' },
  { id: '5', text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius', category: 'persistence' },
  { id: '6', text: 'Recovery is not for people who need it, it is for people who want it.', author: 'Unknown', category: 'recovery' },
  { id: '7', text: 'Every small step is a step towards a healthier you.', author: 'Unknown', category: 'persistence' },
  { id: '8', text: 'Your body hears everything your mind says. Stay positive.', author: 'Unknown', category: 'health' },
  { id: '9', text: 'Pain is temporary. Quitting lasts forever.', author: 'Lance Armstrong', category: 'persistence' },
  { id: '10', text: 'The only bad workout is the one that did not happen.', author: 'Unknown', category: 'strength' },
];

export const getRandomQuote = (): MotivationalQuote => {
  return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
};

export const getQuoteByCategory = (category: MotivationalQuote['category']): MotivationalQuote => {
  const categoryQuotes = motivationalQuotes.filter((q) => q.category === category);
  return categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)];
};