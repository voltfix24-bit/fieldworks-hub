import { HomeSidebar } from '@/components/home/HomeSidebar';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeCategoryGrid } from '@/components/home/HomeCategoryGrid';

const Index = () => {
  return (
    <div className="flex min-h-screen bg-[#F4F7FA]">
      <HomeSidebar />

      <main className="flex-1 p-4 lg:p-6">
        <div className="mx-auto max-w-[1200px] space-y-5">
          <HomeHero />
          <HomeCategoryGrid />

          {/* Footer */}
          <footer className="flex items-center justify-between rounded-2xl border border-[#E8ECF1]/60 bg-white/50 backdrop-blur-md px-6 py-4">
            <p className="text-[11px] font-medium text-[#A0B0C4]">
              © {new Date().getFullYear()} AardingRapport — Alle rechten voorbehouden
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-[11px] font-medium text-[#6B7F99] hover:text-[#0A1929] transition-colors">
                Privacy
              </a>
              <a href="#" className="text-[11px] font-medium text-[#6B7F99] hover:text-[#0A1929] transition-colors">
                Voorwaarden
              </a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Index;
