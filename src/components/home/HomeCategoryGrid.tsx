import { Home, Briefcase, ArrowRightLeft, Users } from 'lucide-react';

const categories = [
  {
    icon: Home,
    title: 'Wonen',
    description: 'Gebiedsontwikkeling en woningbouw voor de toekomst.',
    accent: false,
  },
  {
    icon: Briefcase,
    title: 'Werken',
    description: 'Projecten, beheer en onderhoud van infrastructuur.',
    accent: false,
  },
  {
    icon: ArrowRightLeft,
    title: 'Verbinden',
    description: 'Veilig van A naar B met slimme verbindingen.',
    accent: true,
  },
  {
    icon: Users,
    title: 'Werken bij',
    description: 'Bekijk onze vacatures en bouw mee aan de toekomst.',
    accent: false,
  },
];

export function HomeCategoryGrid() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((cat) => (
        <a
          key={cat.title}
          href="#"
          className={`group relative flex flex-col rounded-2xl border p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
            cat.accent
              ? 'border-[#F5C518]/20 bg-[#FFFDF5]'
              : 'border-[#E8ECF1]/60 bg-white/70 backdrop-blur-md'
          }`}
        >
          <div
            className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
              cat.accent
                ? 'bg-[#F5C518]/15 text-[#C09B00]'
                : 'bg-[#F0F3F7] text-[#4A6080] group-hover:bg-[#0A1929] group-hover:text-white'
            }`}
          >
            <cat.icon className="h-5 w-5" strokeWidth={2} />
          </div>

          <h3 className="mb-1.5 text-[15px] font-bold text-[#0A1929]">
            {cat.title}
          </h3>

          <p className="text-[12.5px] leading-relaxed text-[#6B7F99] font-medium">
            {cat.description}
          </p>
        </a>
      ))}
    </section>
  );
}
