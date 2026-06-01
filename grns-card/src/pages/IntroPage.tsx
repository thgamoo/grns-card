import grnsLogo from "../assets/grns-logo.png";
import { PaperButton } from "../components/PaperButton";

type IntroPageProps = {
  onNavigateCards: () => void;
  onNavigateRules: () => void;
};

export function IntroPage({
  onNavigateCards,
  onNavigateRules,
}: IntroPageProps) {
  return (
    <div className="relative flex min-h-full items-start overflow-hidden bg-transparent p-0 print:hidden max-[760px]:flex-col max-[760px]:items-center">
      <div className="relative z-[3] mt-[clamp(42px,8svh,86px)] flex w-[min(62vw,760px)] max-w-[760px] flex-col items-center justify-center py-0 max-[760px]:mx-auto max-[760px]:mt-[clamp(34px,8svh,64px)] max-[760px]:w-[min(82vw,440px)] max-[760px]:pb-3.5">
        <p className="absolute left-[15%] top-[13%] mb-1.5 block text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)] [animation:introTypographyIn_860ms_cubic-bezier(0.16,1,0.3,1)_both] [animation-delay:90ms] motion-reduce:animate-none max-[400px]:top-[5%] max-[400px]:left-[10%]">
          한국형 판타지 TCG
        </p>
        <h1 className="mt-[clamp(6px,1.2vw,14px)] w-[min(640px,58vw)] text-[clamp(4.25rem,10.6vw,8.65rem)] leading-none [animation:introTypographyIn_860ms_cubic-bezier(0.16,1,0.3,1)_both] [animation-delay:190ms] motion-reduce:animate-none max-[760px]:w-[min(430px,82vw)]">
          <img className="block h-auto w-full" src={grnsLogo} alt="괴력난신" />
        </h1>
        <div className="flex justify-center gap-16 [animation:introTypographyIn_860ms_cubic-bezier(0.16,1,0.3,1)_both] [animation-delay:360ms] max-[760px]:gap-16 max-[400px]:w-full max-[400px]:flex-col max-[400px]:items-center max-[400px]:gap-8">
          <PaperButton className="max-[400px]:w-full max-[310px]:mr-3" onClick={onNavigateCards}>
            카드 DB
          </PaperButton>
          <PaperButton className="max-[400px]:w-full max-[310px]:mr-3" onClick={onNavigateRules}>
            룰 보기
          </PaperButton>
        </div>
      </div>
    </div>
  );
}
