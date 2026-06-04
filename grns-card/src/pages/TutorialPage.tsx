import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { List, LogOut, RotateCcw, X } from "lucide-react";
import type { MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { InkButton } from "@/components/InkButton";
import { PaperButton } from "@/components/PaperButton";
import { PaperModal } from "@/components/PaperModal";
import { TutorialModal } from "@/components/TutorialModal";
import { cn } from "@/lib/utils";

type ZoneId =
  | "hand"
  | "mulligan"
  | "battlefield"
  | "gate"
  | "rear"
  | "front"
  | "grave"
  | "recruit"
  | "opponentLord";

type Phase =
  | "intro"
  | "tour"
  | "coin"
  | "mulliganIntro"
  | "mulligan"
  | "opponentTurn"
  | "playerTurn"
  | "victory";

type CardModel = {
  id: string;
  name: string;
  zone: ZoneId;
  owner: "player" | "opponent";
  deckIndex: number;
  exhausted?: boolean;
};

type LogEntry = {
  id: string;
  icon: string;
  title: string;
  detail: string;
  snapshot?: EngineSnapshot;
};

type EngineSnapshot = Omit<EngineState, "logs"> & {
  logs: LogEntry[];
};

type Campaign = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  firstPlayer: string;
  opponentLord: string;
  opponentLordArt: string;
  playerDeck: string[];
  opponentDeck: string[];
};

type EngineState = {
  cards: CardModel[];
  selectedCardId: string | null;
  phase: Phase;
  turn: "player" | "opponent";
  turnNumber: number;
  logs: LogEntry[];
  activeLogId: string | null;
  turnBanner: string;
  opponentBubble: string;
  animatingCardIds: string[];
  tourIndex: number;
  coinFlipping: boolean;
  victory: boolean;
  opponentLordPower: number;
  playerTurnDraws: number;
  drawGuideAcknowledged: boolean;
  turnPhaseIndex: number;
  cardModalId: string | null;
};

type TutorialCardFace = {
  cost: number;
  power: number;
  race: string;
  effect: string;
  lore: string;
  sigil: string;
  serial: string;
  illustration: string;
};

const turnPhaseNames = ["정비페이즈", "징집페이즈", "보급배치페이즈", "전쟁페이즈", "소강페이즈"];

const tutorialFramePath = "./docs/card-assets/common/card-frame-20260601.png";
const tutorialEmblemPath = "./docs/faction-diamonds/tu01-emblem.png";
const tutorialPaperModalPath = "./docs/card-assets/ui/modals/paper-modal-secondary.png";
const tutorialBoardPath = "./docs/card-assets/illustrations/tutorial-board/tutorial-battlefield-bg.png";
const playerLordArtPath = "./docs/card-assets/illustrations/tutorial-lords/novice-spirit.png";

const tutorialUi = {
  root:
    "relative grid min-h-svh gap-px overflow-hidden bg-[var(--line)] max-[900px]:portrait:max-h-svh",
  orientationLock:
    "hidden max-[900px]:portrait:fixed max-[900px]:portrait:inset-0 max-[900px]:portrait:z-[1000] max-[900px]:portrait:grid max-[900px]:portrait:place-items-center max-[900px]:portrait:bg-[radial-gradient(circle_at_50%_18%,rgba(159,47,34,0.22),transparent_32%),rgba(17,17,17,0.78)] max-[900px]:portrait:p-5 max-[900px]:portrait:backdrop-blur-md max-[900px]:portrait:backdrop-saturate-75",
  orientationPanel:
    "grid w-[min(360px,calc(100vw-40px))] justify-items-center gap-3 border border-[var(--line)] bg-[var(--paper)] px-5 py-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.38)] [&>svg]:size-[42px] [&>svg]:text-[#9f2f22] [&>strong]:font-['Gowun_Batang'] [&>strong]:text-[1.55rem] [&>strong]:font-black [&>strong]:leading-[1.15] [&>span]:text-[0.95rem] [&>span]:font-extrabold [&>span]:leading-normal [&>span]:text-[#333]",
  floatingActions:
    "pointer-events-none fixed left-3.5 right-3.5 top-3.5 z-[70] flex justify-between gap-3",
  overlayButton:
    "pointer-events-auto [--paper-button-height:38px] [--paper-button-padding-x:18px] text-[0.82rem] [&_svg]:size-4",
  stageBackdrop:
    "fixed inset-0 z-[90] grid place-items-center bg-black/60 p-6",
  stageModal:
    "w-[min(560px,calc(100vw-32px))] max-h-[min(680px,calc(100svh-48px))] gap-4 overflow-hidden px-[clamp(48px,6vw,70px)] py-[clamp(44px,5.5vw,62px)]",
  stageHeader: "absolute right-[clamp(42px,6vw,68px)] top-[clamp(34px,5vw,54px)] z-10 flex items-center justify-end",
  stageTitle: "text-[clamp(1.65rem,3vw,2.35rem)]",
  stageClose: "[--paper-button-height:34px] [--paper-button-padding-x:12px]",
  stageList: "grid gap-2 overflow-y-auto pr-0.5",
  stageListButton:
    "h-auto min-h-[62px] w-full [--paper-button-height:62px] [--paper-button-padding-x:16px]",
  stageListButtonContent:
    "grid w-full grid-cols-[34px_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1 text-left",
  stageListButtonActive: "[filter:brightness(0.78)_saturate(0.9)]",
  stageNumber:
    "row-span-2 grid aspect-square w-7 place-items-center border border-current font-['Gowun_Batang'] font-black",
  stageName: "font-['Gowun_Batang'] text-[1.08rem]",
  stageSubtitle: "text-[0.78rem] font-black not-italic opacity-70",
  layout:
    "grid h-svh grid-cols-1 overflow-hidden bg-[#111]",
  engine:
    "relative grid h-svh min-h-0 overflow-hidden bg-[#111] [grid-template-areas:'opponent_opponent_opponent'_'camps_field_side'_'mulligan_mulligan_side'] [grid-template-columns:minmax(160px,0.18fr)_minmax(520px,1fr)_minmax(160px,0.18fr)] [grid-template-rows:auto_minmax(0,1fr)_auto]",
  boardBgLayer:
    "pointer-events-none absolute left-0 right-0 z-0 h-1/2 overflow-hidden",
  boardBgLayerTop:
    "top-0 after:absolute after:inset-x-0 after:bottom-0 after:h-[clamp(56px,11vh,120px)] after:bg-gradient-to-b after:from-transparent after:via-black/45 after:to-black after:content-['']",
  boardBgLayerBottom: "top-1/2",
  boardBgLayerBottomFade:
    "after:absolute after:inset-x-0 after:top-0 after:h-[clamp(56px,11vh,120px)] after:bg-gradient-to-b after:from-black after:via-black/45 after:to-transparent after:content-['']",
  boardBgImage:
    "absolute left-1/2 top-0 h-full w-auto max-w-none -translate-x-1/2 select-none object-contain",
  boardBgImageTop: "absolute left-1/2 top-[6vh] h-full w-auto max-w-none -translate-x-1/2 select-none object-contain rotate-180",
  boardBgImageBottom:
    "absolute left-1/2 top-0 h-full w-auto max-w-none -translate-x-1/2 select-none object-contain",
  opponent:
    "relative z-[1] grid [grid-area:opponent] grid-cols-[150px_minmax(220px,1fr)_150px] items-center gap-3 px-[clamp(10px,2vw,22px)] pt-[clamp(8px,1.8vw,18px)]",
  fieldMain:
    "pointer-events-none absolute left-1/2 top-1/2 z-[2] h-1/2 w-[min(88.85vh,100vw)] -translate-x-1/2",
  camps: "relative z-[1] grid [grid-area:camps] grid-rows-2 gap-3 self-center pl-[clamp(10px,2vw,22px)]",
  sideStacks: "relative z-[1] grid [grid-area:side] grid-rows-2 gap-3 self-center pr-[clamp(10px,2vw,22px)]",
  zoneBase:
    "relative grid min-h-[132px] min-w-0 gap-2 border border-white/20 bg-[#fff9e6]/10 p-2.5 text-left text-[var(--ink)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
  zoneActive:
    "outline-[3px] outline-[rgba(159,47,34,0.52)] shadow-[0_0_0_7px_rgba(255,245,214,0.78),0_14px_28px_rgba(17,17,17,0.2)]",
  tourHighlight:
    "z-20 border-[#fff5d6] outline outline-4 outline-[#fff5d6] shadow-[0_0_26px_rgba(255,245,214,0.88)]",
  zoneTitle: "text-[0.72rem] font-black text-[#5c554d]",
  zoneCards: "flex min-w-0 flex-wrap items-center gap-1.5",
  zoneCardsGrid5: "grid h-full grid-cols-5 items-center justify-items-center",
  zoneCardsGrid4: "grid h-full grid-cols-4 items-center justify-items-center",
  zoneSlot:
    "grid h-full min-h-0 min-w-0 place-items-center rounded-sm border border-dashed border-black/15 bg-white/5 p-1 text-center text-[0.72rem] font-black leading-[1.18] text-black/45",
  zoneSlotBattlefield: "",
  zoneSlotGate: "",
  zoneSlotFilled: "border-solid border-black/20 bg-transparent text-[var(--ink)]",
  zoneSlotSelected: "bg-[#fff5d6] outline outline-2 outline-[rgba(159,47,34,0.7)]",
  zoneSlotDrawing: "animate-[drawTokenToZone_520ms_ease_both]",
  recruitStack: "content-center justify-items-center text-center",
  recruitVisual:
    "relative h-[84px] w-[66px] [&>span]:absolute [&>span]:inset-0 [&>span]:border [&>span]:border-[var(--line)] [&>span]:bg-[linear-gradient(135deg,#111_0_12%,#fff_12%_20%,#d8e1d8_20%_100%)] [&>span]:shadow-[0_8px_12px_rgba(17,17,17,0.16)] [&>span:nth-child(1)]:-translate-x-1.5 [&>span:nth-child(1)]:translate-y-[5px] [&>span:nth-child(1)]:-rotate-[5deg] [&>span:nth-child(2)]:translate-x-0.5 [&>span:nth-child(2)]:translate-y-px [&>span:nth-child(2)]:rotate-2 [&>span:nth-child(3)]:translate-x-[7px] [&>span:nth-child(3)]:-translate-y-[3px] [&>span:nth-child(3)]:rotate-[5deg]",
  recruitCount:
    "grid aspect-square w-[38px] place-items-center rounded-full border border-[var(--line)] bg-[var(--paper)] text-base",
  recruitTop:
    "max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[0.72rem] font-black not-italic text-[#5c554d]",
  opponentLord:
    "relative grid aspect-video min-h-0 w-[min(270px,100%)] justify-self-center overflow-hidden rounded-lg border-[3px] border-[rgba(17,17,17,0.72)] bg-[#17130f] p-2.5 text-left text-white shadow-[0_14px_24px_rgba(27,21,14,0.22)] [grid-template-areas:'label_power'_'name_power'] [grid-template-columns:minmax(0,1fr)_auto] [grid-template-rows:auto_1fr] after:pointer-events-none after:absolute after:inset-0 after:z-0 after:content-[''] after:bg-[linear-gradient(90deg,rgba(9,8,7,0.72),rgba(9,8,7,0.22)_54%,rgba(9,8,7,0.66)),linear-gradient(180deg,rgba(9,8,7,0.12),rgba(9,8,7,0.8))]",
  opponentArt: "absolute inset-0 h-full w-full object-cover",
  opponentLabel:
    "relative z-[1] [grid-area:label] text-[0.72rem] font-black text-[#fffaf0]/80 [text-shadow:0_2px_7px_rgba(0,0,0,0.72)]",
  opponentName:
    "relative z-[1] self-end [grid-area:name] max-w-[calc(100%-4px)] whitespace-normal text-left font-['Gowun_Batang'] text-[clamp(1rem,1.45vw,1.22rem)] leading-[1.08] text-[#fffaf0] [text-shadow:0_2px_8px_rgba(0,0,0,0.78)]",
  opponentPower:
    "relative z-[1] grid aspect-square w-8 place-items-center self-end justify-self-end rounded-full border border-[var(--line)] bg-[#fffaf0]/90 text-[0.72rem] font-black not-italic text-[var(--ink)] [grid-area:power]",
  opponentSpeech:
    "absolute -bottom-[18px] -right-[22px] max-w-[220px] border border-[var(--line)] bg-white px-2.5 py-2 text-[0.82rem] leading-[1.35] shadow-[0_10px_22px_rgba(17,17,17,0.16)]",
  hand:
    "absolute bottom-0 left-[clamp(18px,4vw,76px)] right-[clamp(18px,4vw,76px)] z-[18] flex min-h-[220px] min-w-0 translate-y-[150px] items-end overflow-x-auto overflow-y-visible border border-black/30 bg-[#fff8e8]/62 px-[18px] pb-5 pt-[42px] shadow-[0_-18px_44px_rgba(17,17,17,0.16)] backdrop-blur-sm transition-[transform,background] duration-200 hover:translate-y-0 hover:bg-[#fff8e8]/92 focus-within:translate-y-0 focus-within:bg-[#fff8e8]/92",
  handSelected:
    "translate-y-[226px] hover:translate-y-0 focus-within:translate-y-0 [&_[data-tutorial-card]:not([data-selected='true'])]:translate-y-[72px] [&_[data-tutorial-card]:not([data-selected='true'])]:scale-[0.92] [&_[data-tutorial-card]:not([data-selected='true'])]:opacity-35 [&_[data-tutorial-card][data-selected='true']]:z-40 [&_[data-tutorial-card][data-selected='true']]:-translate-y-[18px] [&_[data-tutorial-card][data-selected='true']]:drop-shadow-[0_14px_22px_rgba(17,17,17,0.32)]",
  handLabel:
    "absolute left-1/2 top-2 -translate-x-1/2 border border-black/50 bg-[var(--paper)] px-3 py-[3px] text-[0.72rem] font-black text-[#5c554d]",
  handEmpty: "m-auto font-black text-[#5c554d]",
  mulliganRow:
    "absolute bottom-[clamp(12px,2vw,22px)] left-0 right-0 z-20 grid min-h-[260px] content-center justify-center gap-3 bg-black/65 px-[clamp(18px,4vw,42px)] py-6 [grid-template-columns:minmax(0,720px)]",
  mulliganCards: "flex min-w-0 justify-center overflow-x-auto px-3 py-5 [&_[data-tutorial-card]]:basis-[100px]",
  mulliganActions: "flex justify-center gap-2 [&_button]:min-h-[42px] [&_button]:font-black",
  cardZoomBackdrop:
    "fixed inset-0 z-[80] grid place-items-center bg-black/30 p-5",
  cardZoomPanel:
    "grid w-[min(calc(var(--card-zoom-width)+36px),100%)] justify-items-center gap-3 border border-[var(--line)] bg-[var(--paper)] p-[18px] shadow-[0_28px_90px_rgba(0,0,0,0.36)] [&>strong]:font-['Gowun_Batang'] [&>strong]:text-[1.35rem] [&>em]:font-black [&>em]:not-italic [&>em]:text-[#5c554d]",
  tutorialCard:
    "relative isolate -ml-2 aspect-[1080/1508] min-h-[152px] w-[108px] flex-[0_0_108px] cursor-pointer overflow-hidden rounded-[4.2%/2.8%] border-0 bg-transparent text-[#100d0a] transition-[transform,filter] duration-150 [container-type:size] after:pointer-events-none after:absolute after:inset-0 after:z-[4] after:bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.34),rgba(255,255,255,0.1)_18%,transparent_42%)] after:opacity-0 after:transition-opacity after:duration-150 after:content-[''] first:ml-0 hover:z-[3] hover:-translate-y-2 hover:-rotate-1 hover:drop-shadow-[0_14px_20px_rgba(17,17,17,0.28)] hover:after:opacity-100 focus-visible:z-[3] focus-visible:-translate-y-2 focus-visible:-rotate-1 focus-visible:drop-shadow-[0_14px_20px_rgba(17,17,17,0.28)] focus-visible:after:opacity-100",
  tutorialCardHorizontal:
    "relative isolate m-0 aspect-[1508/1080] min-h-0 w-[min(160px,100%)] flex-none cursor-pointer overflow-visible rounded-sm border-0 bg-transparent text-[#100d0a] transition-[transform,filter] duration-150 [container-type:size] hover:z-[3] hover:-translate-y-1 hover:drop-shadow-[0_14px_20px_rgba(17,17,17,0.28)] focus-visible:z-[3] focus-visible:-translate-y-1 focus-visible:drop-shadow-[0_14px_20px_rgba(17,17,17,0.28)]",
  tutorialCardBody:
    "absolute left-1/2 top-1/2 aspect-[1080/1508] h-[140%] -translate-x-1/2 -translate-y-1/2 rotate-90 [container-type:size]",
  tutorialCardSelected: "z-[3] -translate-y-2 -rotate-1 outline outline-3 outline-offset-2 outline-[rgba(159,47,34,0.55)] drop-shadow-[0_14px_20px_rgba(17,17,17,0.28)]",
  tutorialCardHorizontalSelected: "z-[3] outline outline-3 outline-offset-2 outline-[rgba(159,47,34,0.55)] drop-shadow-[0_14px_20px_rgba(17,17,17,0.28)]",
  tutorialCardDrawing: "animate-[drawCardToHand_560ms_cubic-bezier(0.2,0.82,0.24,1)_both]",
  tutorialCardZoom:
    "pointer-events-none ml-0 h-[var(--card-zoom-height)] w-[var(--card-zoom-width)] flex-none transform-none hover:translate-y-0 hover:rotate-0 focus-visible:translate-y-0 focus-visible:rotate-0",
  cardArt:
    "absolute inset-0 z-0 h-[80%] w-full bg-[#f4eee4] object-contain object-center pointer-events-none select-none",
  cardFallback:
    "grid place-items-center font-['Gowun_Batang'] text-[2.4rem] font-black text-[#100d0a]/80",
  cardFrame: "absolute inset-0 z-[1] h-full w-full object-contain object-center pointer-events-none select-none",
  cardEmblem:
    "absolute bottom-[1.6%] left-[43.9%] z-[2] aspect-square w-[11.4%] object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.68)] pointer-events-none select-none",
  cardCostPower:
    "absolute top-[18.4%] z-[3] grid aspect-square w-[12.4%] place-items-center font-['Gowun_Batang'] text-[11cqw] font-black leading-none text-[#f7ead5] [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]",
  cardCost: "left-[7.1%]",
  cardPower: "right-[7.6%]",
  cardName:
    "absolute left-[19%] right-[19%] top-[8.4%] z-[3] -translate-y-1/2 break-keep text-center font-['Gowun_Batang'] text-[7.2cqw] font-black leading-[0.98] text-[#100d0a] [text-shadow:0_1px_0_rgba(255,245,226,0.78)]",
  cardNameSmall: "text-[6.3cqw]",
  cardNameLong: "text-[5.4cqw]",
  cardNameExtraLong: "text-[4.8cqw]",
  cardText:
    "absolute left-[18.1%] right-[16.4%] top-[68%] z-[3] line-clamp-4 overflow-hidden whitespace-pre-line break-keep text-left text-[4.1cqw] font-extrabold leading-[1.24] text-[#100d0a]",
  cardRace:
    "absolute bottom-[3.7%] left-[8.5%] z-[3] w-[22.8%] translate-x-[10%] overflow-hidden text-ellipsis whitespace-nowrap text-center text-[4.4cqw] font-black leading-none text-[#ead3ef]",
  tourOverlay: "pointer-events-none absolute inset-0 z-30 bg-transparent",
  tourDim:
    "after:pointer-events-none after:absolute after:inset-0 after:z-[11] after:bg-black/50 after:content-['']",
  tourCard:
    "pointer-events-auto relative z-40 grid min-h-[178px] w-[min(330px,calc(100%-32px))] content-center gap-[7px] border-0 bg-[image:var(--paper-modal-bg)] bg-[length:100%_100%] bg-center bg-no-repeat px-[42px] py-[34px] pl-[46px] text-left text-[var(--ink)] drop-shadow-[0_16px_34px_rgba(17,17,17,0.24)] [&>h2]:m-0 [&>h2]:font-['Gowun_Batang'] [&>h2]:text-[clamp(1.24rem,2vw,1.7rem)] [&>h2]:leading-[1.1] [&>p:not(.eyebrow)]:m-0 [&>p:not(.eyebrow)]:break-keep [&>p:not(.eyebrow)]:text-[0.88rem] [&>p:not(.eyebrow)]:font-extrabold [&>p:not(.eyebrow)]:leading-normal [&>p:not(.eyebrow)]:text-[#333] [&>button]:min-h-[34px] [&>button]:justify-self-start [&>button]:border-0 [&>button]:bg-[var(--ink)] [&>button]:px-3 [&>button]:text-[0.82rem] [&>button]:font-black [&>button]:text-[var(--paper)]",
  tourRecruit: "absolute right-[clamp(124px,13vw,180px)] top-[48%] -translate-y-1/2",
  tourHand: "absolute bottom-[118px] left-[clamp(28px,8vw,96px)]",
  tourGate: "absolute bottom-[34%] left-1/2 -translate-x-1/2",
  tourOpponentLord: "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
  drawGuideOverlay:
    "pointer-events-none absolute inset-0 z-30 grid items-end justify-items-center p-[22px]",
  drawGuideCard:
    "grid w-[min(360px,calc(100%-32px))] gap-3 border border-[var(--line)] bg-[var(--paper)] p-5 text-center shadow-[0_24px_80px_rgba(0,0,0,0.32)] [&>h2]:text-[clamp(1.55rem,3vw,2.3rem)] [&>p:not(.eyebrow)]:text-[#333] [&>p:not(.eyebrow)]:leading-[1.62]",
  coinOverlay:
    "pointer-events-auto absolute inset-0 z-30 grid place-items-center gap-[18px] bg-white/70",
  coinToken:
    "relative aspect-square w-28 [transform:rotateY(var(--coin-result-rotation,900deg))] [transform-style:preserve-3d]",
  coinTokenFlipping: "animate-[coinFlip_1200ms_cubic-bezier(0.2,0.78,0.24,1)_both]",
  coinFace:
    "absolute inset-0 grid place-items-center rounded-full border-4 border-[var(--line)] bg-[#fff5d6] font-['Gowun_Batang'] text-[2.6rem] font-black [backface-visibility:hidden]",
  coinBack: "[transform:rotateY(180deg)]",
  coinLabel:
    "border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-[1.1rem] font-black",
  turnBanner:
    "pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 animate-[turnBannerPulse_950ms_ease_both] border border-[var(--line)] bg-white/95 px-[34px] py-4 font-['Gowun_Batang'] text-[clamp(2rem,5vw,4rem)] font-black text-[var(--ink)]",
  modalOverlay: "absolute inset-0 z-[60] grid place-items-center bg-black/40",
  victoryBackdrop:
    "fixed inset-0 z-[100] grid place-items-center bg-black/60 p-5",
  victoryModal: "animate-[victoryModalIn_360ms_ease_both] [&>h2]:text-[clamp(2rem,5vw,3.2rem)]",
} as const;

const zoneBorderClass: Record<ZoneId, string> = {
  hand: "",
  mulligan: "",
  battlefield: "border-[#e0483d]",
  gate: "",
  rear: "border-[#a64ac9]",
  front: "border-[#e0483d]",
  grave: "border-[#222]",
  recruit: "border-[#5b86e5]",
  opponentLord: "",
};

const zoneAreaClass: Partial<Record<ZoneId, string>> = {
  battlefield:
    "pointer-events-auto absolute left-[17.2%] top-[14.8%] h-[23.5%] w-[67.5%] min-h-0 bg-white/10 p-1 [&>span:first-child]:absolute [&>span:first-child]:left-2 [&>span:first-child]:top-1 [&>div]:h-full",
  gate:
    "pointer-events-auto absolute left-[21%] top-[43.8%] h-[16.5%] w-[59%] min-h-0 bg-[repeating-linear-gradient(135deg,rgba(17,17,17,0.035),rgba(17,17,17,0.035)_7px,transparent_7px,transparent_14px),rgba(255,255,255,0.10)] p-1 [&>span:first-child]:absolute [&>span:first-child]:left-2 [&>span:first-child]:top-1 [&>div]:h-full",
};

const boardSlotClass: Partial<Record<ZoneId, string[]>> = {
  battlefield: [
    "absolute left-[0.5%] top-[2%] h-[92%] w-[19%]",
    "absolute left-[20.3%] top-[1%] h-[93%] w-[19%]",
    "absolute left-[40.2%] top-[0%] h-[94%] w-[19%]",
    "absolute left-[60.1%] top-[1%] h-[93%] w-[19%]",
    "absolute left-[80%] top-[2%] h-[92%] w-[19%]",
  ],
  gate: [
    "absolute left-0 top-[3%] h-[90%] w-[23.5%]",
    "absolute left-[25%] top-[1%] h-[92%] w-[23.5%]",
    "absolute left-[50%] top-[1%] h-[92%] w-[23.5%]",
    "absolute left-[75%] top-[3%] h-[90%] w-[23.5%]",
  ],
};

const tourCardPositionClass: Record<"recruit" | "hand" | "gate" | "opponentLord", string> = {
  recruit: tutorialUi.tourRecruit,
  hand: tutorialUi.tourHand,
  gate: tutorialUi.tourGate,
  opponentLord: tutorialUi.tourOpponentLord,
};

const tutorialCardFaces: Record<string, TutorialCardFace> = {
  "문지기 여우": {
    cost: 2,
    power: 3,
    race: "짐승",
    effect: "이 카드는 공격할 수 없다.",
    lore: "문 앞에서 가장 먼저 냄새를 맡는다.",
    sigil: "狐",
    serial: "tu01-0008",
    illustration: "./docs/card-assets/illustrations/tu01/tu01-0008.png",
  },
  "문지기 고양이": {
    cost: 1,
    power: 2,
    race: "짐승",
    effect: "이 카드는 공격할 수 없다.",
    lore: "낯선 발소리를 놓치지 않는다.",
    sigil: "猫",
    serial: "tu01-0007",
    illustration: "./docs/card-assets/illustrations/tu01/tu01-0007.png",
  },
  "새끼 이리": {
    cost: 0,
    power: 0,
    race: "짐승",
    effect: "",
    lore: "무서운 이리도 아기였을 시절이 있죠.",
    sigil: "仔",
    serial: "tu01-0002",
    illustration: "./docs/card-assets/illustrations/tu01/tu01-0002.png",
  },
  "온순한 이리": {
    cost: 1,
    power: 1,
    race: "짐승",
    effect: "",
    lore: "멍멍아 이리로 온,",
    sigil: "溫",
    serial: "tu01-0003",
    illustration: "./docs/card-assets/illustrations/tu01/tu01-0003.png",
  },
  "떠돌이 이리": {
    cost: 2,
    power: 2,
    race: "짐승",
    effect: "",
    lore: "개조심! 물릴 수 있어요.",
    sigil: "浪",
    serial: "tu01-0004",
    illustration: "./docs/card-assets/illustrations/tu01/tu01-0004.png",
  },
  "징집소 지키는 이리": {
    cost: 2,
    power: 2,
    race: "짐승",
    effect: "징집소 맨 위에 있는 한 징집하지 않는다.",
    lore: "",
    sigil: "守",
    serial: "tu01-0006",
    illustration: "./docs/card-assets/illustrations/tu01/tu01-0006.png",
  },
  "쓰디 쓴 쑥떡": {
    cost: 3,
    power: 1,
    race: "도깨비",
    effect: "",
    lore: "이건 호랑이도 싫어해요.",
    sigil: "苦",
    serial: "ob01-0038",
    illustration: "./docs/card-assets/illustrations/ob01/ob01-0038.png",
  },
};

function TutorialScopedStyles() {
  return (
    <style>
      {`
        @keyframes drawCardToHand {
          0% {
            opacity: 0;
            transform: translate(180px, -180px) scale(0.72) rotate(6deg);
          }

          65% {
            opacity: 1;
            transform: translate(-10px, -8px) scale(1.04) rotate(-2deg);
          }

          100% {
            opacity: 1;
            transform: translate(0, 0) scale(1) rotate(0);
          }
        }

        @keyframes drawTokenToZone {
          0% {
            opacity: 0;
            transform: translate(90px, -90px) scale(0.82);
          }

          100% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
        }

        @keyframes coinFlip {
          0% {
            transform: translateY(18px) rotateY(0deg) rotateX(0deg);
          }

          55% {
            transform: translateY(-38px) rotateY(720deg) rotateX(18deg);
          }

          100% {
            transform: translateY(0) rotateY(var(--coin-result-rotation, 900deg)) rotateX(0deg);
          }
        }

        @keyframes turnBannerPulse {
          0% {
            opacity: 0;
            transform: translate(-50%, -48%) scale(0.92);
          }

          22%,
          72% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }

          100% {
            opacity: 0;
            transform: translate(-50%, -54%) scale(1.04);
          }
        }

        @keyframes lordBreak {
          0%,
          35% {
            opacity: 1;
            filter: none;
          }

          100% {
            opacity: 0.35;
            filter: grayscale(1);
          }
        }

        @keyframes victoryModalIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}
    </style>
  );
}

const campaigns: Campaign[] = [
  {
    id: "free-play",
    number: 0,
    title: "자유 단계",
    subtitle: "카드 자유 배치",
    firstPlayer: "자유 배치",
    opponentLord: "연습 상대 0/0",
    opponentLordArt: "./docs/card-assets/illustrations/tutorial-lords/harut-wolf.png",
    opponentDeck: [],
    playerDeck: [
      "문지기 여우",
      "문지기 고양이",
      "문지기 고양이",
      "떠돌이 이리",
      "온순한 이리",
      "새끼 이리",
      "징집소 지키는 이리",
      "쓰디 쓴 쑥떡",
    ],
  },
  {
    id: "one-day-wolf",
    number: 1,
    title: "하룻 이리",
    subtitle: "게임 준비 및 멀리건",
    firstPlayer: "나: 후공",
    opponentLord: "하룻 이리 1/2",
    opponentLordArt: "./docs/card-assets/illustrations/tutorial-lords/harut-wolf.png",
    opponentDeck: ["징집소 지키는 이리 x1"],
    playerDeck: [
      "문지기 여우",
      "문지기 고양이",
      "문지기 고양이",
      "떠돌이 이리",
      "온순한 이리",
      "문지기 고양이",
      "문지기 여우",
      "문지기 여우",
      "떠돌이 이리",
      "온순한 이리",
      "새끼 이리",
      "징집소 지키는 이리",
    ],
  },
  {
    id: "peace-bear",
    number: 2,
    title: "평화주의 곰",
    subtitle: "기지 키워드",
    firstPlayer: "나: 선공",
    opponentLord: "평화주의 곰 2/3",
    opponentLordArt: "./docs/card-assets/illustrations/tutorial-lords/peace-bear.png",
    opponentDeck: ["징집소 지키는 이리 x1"],
    playerDeck: [
      "새끼 이리",
      "문지기 고양이",
      "북방 사냥꾼",
      "북방 덫 개발자",
      "북방마비산 제조사",
      "문지기 고양이",
      "새끼 이리",
      "북방 사냥꾼",
      "위협용 거대 우리",
      "징집소 지키는 이리",
    ],
  },
  {
    id: "betrayal-tiger",
    number: 3,
    title: "배신 범",
    subtitle: "공격, 전투광, 정복 승리",
    firstPlayer: "나: 선공",
    opponentLord: "배신 범 5/6",
    opponentLordArt: "./docs/card-assets/illustrations/tutorial-lords/betrayal-tiger.png",
    opponentDeck: ["징집소 지키는 이리 x1"],
    playerDeck: [
      "문지기 고양이",
      "문지기 여우",
      "북방 덫 개발자",
      "어슬렁 거리는 산군",
      "북방마비산 제조사",
      "북방 사냥꾼",
      "광폭한 거대 고양이",
      "쓰디 쓴 쑥떡",
    ],
  },
  {
    id: "fox-entourage",
    number: 4,
    title: "호가호위 여우",
    subtitle: "출정, 희생, 단말마",
    firstPlayer: "나: 선공",
    opponentLord: "호가호위 여우 4/5",
    opponentLordArt: "./docs/card-assets/illustrations/tutorial-lords/fox-entourage.png",
    opponentDeck: ["징집소 지키는 이리 x1"],
    playerDeck: [
      "미래를 뒤트는 까마귀",
      "산중호걸 호랑님",
      "문지기 고양이",
      "문지기 여우",
      "배고픈 사냥꾼",
      "미래를 뒤트는 까마귀",
      "문지기 고양이",
      "문지기 여우",
      "산중호걸 호랑님",
      "쓰디 쓴 쑥떡",
    ],
  },
];

function initialState(campaign: Campaign): EngineState {
  const isFreePlay = campaign.id === "free-play";

  return {
    cards: campaign.playerDeck.map((name, index) => ({
      id: `${campaign.id}-card-${index}`,
      name,
      owner: "player",
      deckIndex: index,
      zone: isFreePlay ? "hand" : "recruit",
    })),
    selectedCardId: null,
    phase: isFreePlay ? "playerTurn" : "intro",
    turn: campaign.firstPlayer.includes("후공") ? "opponent" : "player",
    turnNumber: isFreePlay ? 1 : 0,
    logs: [
      {
        id: "log-start",
        icon: "始",
        title: isFreePlay ? "자유 배치" : "대기",
        detail: isFreePlay
          ? "군영의 카드를 원하는 구역에 자유롭게 배치할 수 있습니다."
          : "튜토리얼 시작 버튼을 누르면 초기 징집과 턴 전환이 시작됩니다.",
      },
    ],
    activeLogId: null,
    turnBanner: "",
    opponentBubble: "",
    animatingCardIds: [],
    tourIndex: 0,
    coinFlipping: false,
    victory: false,
    opponentLordPower: Number(campaign.opponentLord.match(/(\d+)\/\d+/)?.[1] ?? 4),
    playerTurnDraws: isFreePlay ? 2 : 0,
    drawGuideAcknowledged: isFreePlay,
    turnPhaseIndex: 0,
    cardModalId: null,
  };
}

const tourSteps = [
  {
    zone: "recruit" as const,
    title: "징집소",
    detail: "덱입니다. 위에서부터 순서대로 카드를 가져오며, 차례 시작마다 보통 2장을 군영으로 가져옵니다.",
  },
  {
    zone: "hand" as const,
    title: "군영",
    detail: "손패입니다. 출정하거나 보급으로 쓰기 전 카드가 머무는 곳입니다.",
  },
  {
    zone: "gate" as const,
    title: "문지기",
    detail: "게임 시작 때 성 앞에 가로로 배치하는 수비 카드입니다.",
  },
  {
    zone: "opponentLord" as const,
    title: "성주",
    detail: "성주가 매장지로 이동하면 패배합니다.",
  },
];

function snapshot(state: EngineState): EngineSnapshot {
  return { ...state, cards: state.cards.map((card) => ({ ...card })), logs: [...state.logs] };
}

function sortByDeckOrder(cards: CardModel[]) {
  return [...cards].sort((a, b) => a.deckIndex - b.deckIndex);
}

function shortCardName(name: string) {
  return name.replace(/\s*[—-].*$/, "").replace(/\s+x\d+$/, "");
}

function cardSigil(name: string) {
  if (name.includes("호랑") || name.includes("산군") || name.includes("범")) return "虎";
  if (name.includes("곰")) return "熊";
  if (name.includes("여우")) return "狐";
  if (name.includes("고양이")) return "猫";
  if (name.includes("이리")) return "狼";
  if (name.includes("까마귀")) return "烏";
  if (name.includes("사냥꾼")) return "獵";
  return "怪";
}

function cardPower(name: string) {
  if (name.includes("광폭한")) return 3;
  if (name.includes("산군")) return 4;
  if (name.includes("사냥꾼")) return 2;
  if (name.includes("까마귀")) return 0;
  return Math.max(0, name.length % 4);
}

function tutorialAssetPath(file: string) {
  if (/^(https?:)?\/\//.test(file)) return file;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = file.replace(/^\.?\//, "");
  return `${base}/${path}`;
}

function tutorialCardFace(card: CardModel): TutorialCardFace {
  return tutorialCardFaces[card.name] ?? {
    cost: card.name.length % 4,
    power: cardPower(card.name),
    race: card.name.includes("떡") ? "도구" : "짐승",
    effect: "",
    lore: `${shortCardName(card.name)} 튜토리얼 카드`,
    sigil: cardSigil(card.name),
    serial: `tu-${String(card.deckIndex + 1).padStart(2, "0")}`,
    illustration: "",
  };
}

function zoneTitle(zone: ZoneId) {
  const titles: Record<ZoneId, string> = {
    hand: "군영",
    mulligan: "초기 선택",
    battlefield: "전장",
    gate: "문지기",
    rear: "후방기지",
    front: "전진기지",
    grave: "매장지",
    recruit: "징집소",
    opponentLord: "상대 성주",
  };
  return titles[zone];
}

function logIcon(zone: ZoneId) {
  const icons: Record<ZoneId, string> = {
    hand: "軍",
    mulligan: "初",
    battlefield: "戰",
    gate: "門",
    rear: "後",
    front: "前",
    grave: "葬",
    recruit: "徵",
    opponentLord: "主",
  };
  return icons[zone];
}

function drawTop(cards: CardModel[], count: number, targetZone: ZoneId) {
  const recruitCards = sortByDeckOrder(cards.filter((card) => card.zone === "recruit"));
  const drawnCards = recruitCards.slice(0, count);
  const drawnIds = new Set(drawnCards.map((card) => card.id));
  return {
    drawnCards,
    cards: cards.map((card) => (drawnIds.has(card.id) ? { ...card, zone: targetZone } : card)),
  };
}

function recruitTopCard(cards: CardModel[]) {
  return sortByDeckOrder(cards.filter((card) => card.zone === "recruit"))[0];
}

function isRecruitGuard(card?: CardModel) {
  return Boolean(card?.name.includes("징집소 지키는 이리"));
}

function TutorialCard({
  card,
  selected,
  drawing = false,
  drawIndex = 0,
  horizontal = false,
  zoomed = false,
  onClick,
}: {
  card: CardModel;
  selected: boolean;
  drawing?: boolean;
  drawIndex?: number;
  horizontal?: boolean;
  zoomed?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const face = tutorialCardFace(card);
  const rulesText = face.effect || face.lore;
  const compactName =
    card.name.length >= 11
      ? tutorialUi.cardNameExtraLong
      : card.name.length >= 9
        ? tutorialUi.cardNameLong
        : card.name.length > 6
          ? tutorialUi.cardNameSmall
          : undefined;

  return (
    <button
      className={cn(
        horizontal ? tutorialUi.tutorialCardHorizontal : tutorialUi.tutorialCard,
        selected && (horizontal ? tutorialUi.tutorialCardHorizontalSelected : tutorialUi.tutorialCardSelected),
        drawing && tutorialUi.tutorialCardDrawing,
        zoomed && tutorialUi.tutorialCardZoom,
      )}
      style={
        {
          "--draw-index": drawIndex,
          animationDelay: drawing ? `${Math.max(drawIndex, 0) * 80}ms` : undefined,
        } as CSSProperties
      }
      type="button"
      data-tutorial-card
      data-selected={selected ? "true" : "false"}
      onClick={onClick}
    >
      <span className={horizontal ? tutorialUi.tutorialCardBody : "contents"}>
        {face.illustration ? (
          <img
            className={tutorialUi.cardArt}
            src={tutorialAssetPath(face.illustration)}
            alt=""
            aria-hidden="true"
          />
        ) : (
          <span className={cn(tutorialUi.cardArt, tutorialUi.cardFallback)}>
            {face.sigil}
          </span>
        )}
        <img
          className={tutorialUi.cardFrame}
          src={tutorialAssetPath(tutorialFramePath)}
          alt=""
          aria-hidden="true"
        />
        <img
          className={tutorialUi.cardEmblem}
          src={tutorialAssetPath(tutorialEmblemPath)}
          alt=""
          aria-hidden="true"
        />
        <span className={cn(tutorialUi.cardCostPower, tutorialUi.cardCost)}>{face.cost}</span>
        <span className={cn(tutorialUi.cardCostPower, tutorialUi.cardPower)}>{face.power}</span>
        <strong className={cn(tutorialUi.cardName, compactName)}>
          {shortCardName(card.name)}
        </strong>
        <span className={tutorialUi.cardText}>{rulesText}</span>
        <span className={tutorialUi.cardRace}>{face.race}</span>
      </span>
    </button>
  );
}

function RecruitStackZone({
  cards,
  onClick,
  label = "징집소",
  tourActive = false,
}: {
  cards: CardModel[];
  onClick: () => void;
  label?: string;
  tourActive?: boolean;
}) {
  const orderedCards = sortByDeckOrder(cards);
  const topCard = orderedCards[0];

  return (
    <button
      className={cn(
        tutorialUi.zoneBase,
        zoneBorderClass.recruit,
        tutorialUi.recruitStack,
        tourActive && tutorialUi.tourHighlight,
      )}
      type="button"
      onClick={onClick}
    >
      <span className={tutorialUi.zoneTitle}>{label}</span>
      <div className={tutorialUi.recruitVisual} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <strong className={tutorialUi.recruitCount}>{orderedCards.length}장</strong>
      <em className={tutorialUi.recruitTop}>{topCard ? `맨 위: ${shortCardName(topCard.name)}` : "비어 있음"}</em>
    </button>
  );
}

function ZoneSlot({
  zone,
  cards,
  active,
  tourActive = false,
  selectedCardId,
  animatingCardIds,
  slots = 0,
  onClick,
  onCardClick,
}: {
  zone: ZoneId;
  cards: CardModel[];
  active: boolean;
  tourActive?: boolean;
  selectedCardId: string | null;
  animatingCardIds: string[];
  slots?: number;
  onClick: () => void;
  onCardClick: (card: CardModel) => void;
}) {
  const slotCount = Math.max(slots, cards.length);
  const slotClasses = boardSlotClass[zone];

  const activateZone = () => onClick();

  return (
    <div
      className={cn(
        tutorialUi.zoneBase,
        zoneBorderClass[zone],
        zoneAreaClass[zone],
        active && tutorialUi.zoneActive,
        tourActive && tutorialUi.tourHighlight,
      )}
      role="button"
      tabIndex={0}
      onClick={activateZone}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activateZone();
      }}
    >
      <span className={tutorialUi.zoneTitle}>{zoneTitle(zone)}</span>
      <div
        className={cn(
          tutorialUi.zoneCards,
          zone === "battlefield" && tutorialUi.zoneCardsGrid5,
          zone === "gate" && tutorialUi.zoneCardsGrid4,
        )}
      >
        {slotCount > 0 ? (
          Array.from({ length: slotCount }, (_, index) => {
            const card = cards[index];
            return (
              <span
                key={card?.id ?? `${zone}-slot-${index}`}
                className={cn(
                  tutorialUi.zoneSlot,
                  slotClasses?.[index],
                  zone === "battlefield" && tutorialUi.zoneSlotBattlefield,
                  zone === "gate" && tutorialUi.zoneSlotGate,
                  card && tutorialUi.zoneSlotFilled,
                  card?.id === selectedCardId && tutorialUi.zoneSlotSelected,
                  card && animatingCardIds.includes(card.id) && tutorialUi.zoneSlotDrawing,
                )}
              >
                {card && (
                  <TutorialCard
                    card={card}
                    selected={card.id === selectedCardId}
                    drawing={animatingCardIds.includes(card.id)}
                    drawIndex={animatingCardIds.indexOf(card.id)}
                    horizontal={zone === "gate" || zone === "battlefield"}
                    onClick={(event) => {
                      event.stopPropagation();
                      onCardClick(card);
                    }}
                  />
                )}
              </span>
            );
          })
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

function BattlefieldZone({
  cards,
  active,
  selectedCardId,
  animatingCardIds,
  onClick,
  onCardClick,
}: {
  cards: CardModel[];
  active: boolean;
  selectedCardId: string | null;
  animatingCardIds: string[];
  onClick: () => void;
  onCardClick: (card: CardModel) => void;
}) {
  const activateZone = () => onClick();

  return (
    <div
      className={cn(
        tutorialUi.zoneBase,
        zoneBorderClass.battlefield,
        zoneAreaClass.battlefield,
        active && tutorialUi.zoneActive,
      )}
      role="button"
      tabIndex={0}
      onClick={activateZone}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activateZone();
      }}
    >
      <span className={tutorialUi.zoneTitle}>{zoneTitle("battlefield")}</span>
      <div className={cn(tutorialUi.zoneCards, tutorialUi.zoneCardsGrid5)}>
        {Array.from({ length: 5 }, (_, index) => {
          const card = cards[index];
          return (
            <span
              key={card?.id ?? `battlefield-slot-${index}`}
              className={cn(
                tutorialUi.zoneSlot,
                boardSlotClass.battlefield?.[index],
                tutorialUi.zoneSlotBattlefield,
                card && tutorialUi.zoneSlotFilled,
                card?.id === selectedCardId && tutorialUi.zoneSlotSelected,
                card && animatingCardIds.includes(card.id) && tutorialUi.zoneSlotDrawing,
              )}
            >
              {card && (
                <TutorialCard
                  card={card}
                  selected={card.id === selectedCardId}
                  drawing={animatingCardIds.includes(card.id)}
                  drawIndex={animatingCardIds.indexOf(card.id)}
                  horizontal
                  onClick={(event) => {
                    event.stopPropagation();
                    onCardClick(card);
                  }}
                />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function GateZone({
  cards,
  active,
  tourActive = false,
  selectedCardId,
  animatingCardIds,
  onClick,
  onCardClick,
}: {
  cards: CardModel[];
  active: boolean;
  tourActive?: boolean;
  selectedCardId: string | null;
  animatingCardIds: string[];
  onClick: () => void;
  onCardClick: (card: CardModel) => void;
}) {
  const activateZone = () => onClick();

  return (
    <div
      className={cn(
        tutorialUi.zoneBase,
        zoneBorderClass.gate,
        zoneAreaClass.gate,
        active && tutorialUi.zoneActive,
        tourActive && tutorialUi.tourHighlight,
      )}
      role="button"
      tabIndex={0}
      onClick={activateZone}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activateZone();
      }}
    >
      <span className={tutorialUi.zoneTitle}>{zoneTitle("gate")}</span>
      <div className={cn(tutorialUi.zoneCards, tutorialUi.zoneCardsGrid4)}>
        {Array.from({ length: 4 }, (_, index) => {
          const card = cards[index];
          return (
            <span
              key={card?.id ?? `gate-slot-${index}`}
              className={cn(
                tutorialUi.zoneSlot,
                boardSlotClass.gate?.[index],
                tutorialUi.zoneSlotGate,
                card && tutorialUi.zoneSlotFilled,
                card?.id === selectedCardId && tutorialUi.zoneSlotSelected,
                card && animatingCardIds.includes(card.id) && tutorialUi.zoneSlotDrawing,
              )}
            >
              {card && (
                <TutorialCard
                  card={card}
                  selected={card.id === selectedCardId}
                  drawing={animatingCardIds.includes(card.id)}
                  drawIndex={animatingCardIds.indexOf(card.id)}
                  horizontal
                  onClick={(event) => {
                    event.stopPropagation();
                    onCardClick(card);
                  }}
                />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function TutorialPage({ onExit }: { onExit: () => void }) {
  const [campaignIndex, setCampaignIndex] = useState(1);
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const campaign = campaigns[campaignIndex];
  const isFreePlay = campaign.id === "free-play";
  const [state, setState] = useState<EngineState>(() => initialState(campaign));
  const selectedCard = state.cards.find((card) => card.id === state.selectedCardId);
  const zones = useMemo(() => {
    return {
      hand: sortByDeckOrder(state.cards.filter((card) => card.zone === "hand")),
      mulligan: sortByDeckOrder(state.cards.filter((card) => card.zone === "mulligan")),
      battlefield: sortByDeckOrder(state.cards.filter((card) => card.zone === "battlefield")),
      gate: sortByDeckOrder(state.cards.filter((card) => card.zone === "gate")),
      rear: sortByDeckOrder(state.cards.filter((card) => card.zone === "rear")),
      front: sortByDeckOrder(state.cards.filter((card) => card.zone === "front")),
      grave: sortByDeckOrder(state.cards.filter((card) => card.zone === "grave")),
      recruit: sortByDeckOrder(state.cards.filter((card) => card.zone === "recruit")),
    };
  }, [state.cards]);

  const pushLog = (
    current: EngineState,
    icon: string,
    title: string,
    detail: string,
    before?: EngineSnapshot,
  ): LogEntry[] => [
    {
      id: `log-${Date.now()}-${current.logs.length}`,
      icon,
      title,
      detail,
      snapshot: before,
    },
    ...current.logs,
  ].slice(0, 18);

  const resetCampaign = (nextIndex = campaignIndex) => {
    const nextCampaign = campaigns[nextIndex];
    setCampaignIndex(nextIndex);
    setState(initialState(nextCampaign));
    setStageModalOpen(false);
  };

  const showBanner = (text: string) => {
    setState((current) => ({ ...current, turnBanner: text }));
    window.setTimeout(() => {
      setState((current) => ({ ...current, turnBanner: "" }));
    }, 950);
  };

  const drawToMulligan = () => {
    setState((current) => {
      if (current.phase !== "mulliganIntro") return current;
      const before = snapshot(current);
      const { cards, drawnCards } = drawTop(current.cards, 4, "mulligan");
      return {
        ...current,
        cards,
        phase: "mulligan",
        turn: "player",
        turnNumber: 1,
        animatingCardIds: drawnCards.map((card) => card.id),
        logs: pushLog(
          current,
          "徵",
          "초기 4장",
          `${drawnCards.map((card) => shortCardName(card.name)).join(", ")}을 징집소 위에서 공개했습니다.`,
          before,
        ),
      };
    });
    window.setTimeout(() => {
      setState((current) => ({ ...current, animatingCardIds: [] }));
    }, 520);
  };

  const startTutorial = () => {
    setState((current) => ({ ...current, phase: "tour", tourIndex: 0 }));
  };

  const advanceTour = () => {
    if (state.tourIndex < tourSteps.length - 1) {
      setState((current) => ({ ...current, tourIndex: current.tourIndex + 1 }));
      return;
    }

    setState((current) => ({ ...current, phase: "coin", coinFlipping: true }));
    window.setTimeout(() => {
      setState((current) => ({ ...current, coinFlipping: false }));
      window.setTimeout(() => {
        setState((current) => ({ ...current, phase: "mulliganIntro" }));
      }, 520);
    }, 1250);
  };

  const placeInitialGates = (mode: "gate-first" | "army-first") => {
    setState((current) => {
      if (current.phase !== "mulligan") return current;
      const before = snapshot(current);
      const candidates = sortByDeckOrder(current.cards.filter((card) => card.zone === "mulligan"));
      let nextCards = current.cards;
      let gateCards: CardModel[];
      let handCards: CardModel[];

      if (mode === "gate-first") {
        const gateIds = new Set(candidates.slice(0, 4).map((card) => card.id));
        nextCards = nextCards.map((card) => (gateIds.has(card.id) ? { ...card, zone: "gate" } : card));
        const drawn = drawTop(nextCards, 5, "hand");
        nextCards = drawn.cards;
        gateCards = candidates.slice(0, 4);
        handCards = drawn.drawnCards;
      } else {
        const candidateIds = new Set(candidates.map((card) => card.id));
        const oneMore = drawTop(nextCards, 1, "hand");
        nextCards = oneMore.cards.map((card) => (candidateIds.has(card.id) ? { ...card, zone: "hand" } : card));
        const gates = drawTop(nextCards, 4, "gate");
        nextCards = gates.cards;
        gateCards = gates.drawnCards;
        handCards = [...candidates, ...oneMore.drawnCards];
      }

      return {
        ...current,
        cards: nextCards,
        phase: "opponentTurn",
        selectedCardId: null,
        animatingCardIds: [...gateCards, ...handCards].map((card) => card.id),
        logs: pushLog(
          current,
          "門",
          mode === "gate-first" ? "문지기 배치" : "군영 선택",
          mode === "gate-first"
            ? "공개된 4장을 문지기로 가로 배치하고 5장을 군영으로 가져왔습니다."
            : "공개된 4장과 추가 1장을 군영으로 쓰고, 다음 4장을 문지기로 배치했습니다.",
          before,
        ),
      };
    });
    window.setTimeout(() => {
      setState((current) => ({ ...current, animatingCardIds: [] }));
      beginOpponentTurn();
    }, 520);
  };

  const beginOpponentTurn = () => {
    showBanner("상대턴");
    setState((current) => ({ ...current, opponentBubble: "그르릉..." }));
    window.setTimeout(() => {
      setState((current) => ({ ...current, opponentBubble: "" }));
      beginPlayerTurn();
    }, 1900);
  };

  const beginPlayerTurn = () => {
    showBanner("나의턴");
    window.setTimeout(() => {
      setState((current) => {
        const topCard = recruitTopCard(current.cards);
        const shouldSkipRecruit = isRecruitGuard(topCard);
        const before = snapshot(current);
        return {
          ...current,
          phase: shouldSkipRecruit ? "victory" : "playerTurn",
          turn: "player",
          turnNumber: current.turnNumber + 1,
          playerTurnDraws: 0,
          turnPhaseIndex: shouldSkipRecruit ? 2 : 1,
          victory: shouldSkipRecruit,
          opponentLordPower: shouldSkipRecruit ? 0 : current.opponentLordPower,
          logs: shouldSkipRecruit
            ? pushLog(
                current,
                "徵",
                "징집페이즈 생략",
                "징집소 지키는 이리가 맨 위에 있어 징집페이즈를 생략했습니다.",
                before,
              )
            : current.logs,
        };
      });
    }, 620);
  };

  const selectCard = (card: CardModel) => {
    setState((current) => ({
      ...current,
      selectedCardId: card.owner === "player" ? card.id : current.selectedCardId,
      cardModalId: card.owner === "player" && !isFreePlay ? card.id : current.cardModalId,
    }));
  };

  const closeCardModal = () => {
    setState((current) => ({ ...current, cardModalId: null }));
  };

  const moveSelectedTo = (targetZone: ZoneId) => {
    if (!selectedCard || (!isFreePlay && selectedCard.zone !== "hand")) return;
    if (!["battlefield", "gate", "rear", "front", "grave"].includes(targetZone)) return;
    if (!isFreePlay && targetZone === "gate" && !selectedCard.name.includes("문지기")) return;

    setState((current) => {
      const before = snapshot(current);
      return {
        ...current,
        cards: current.cards.map((card) =>
          card.id === selectedCard.id ? { ...card, zone: targetZone } : card,
        ),
        selectedCardId: null,
        logs: pushLog(
          current,
          logIcon(targetZone),
          zoneTitle(targetZone),
          `${shortCardName(selectedCard.name)}을(를) ${zoneTitle(targetZone)}에 놓았습니다.`,
          before,
        ),
      };
    });
  };

  const drawOneFromRecruit = () => {
    setState((current) => {
      if (current.phase !== "playerTurn") return current;
      if (current.phase === "playerTurn" && current.playerTurnDraws >= 2) return current;
      const before = snapshot(current);
      const topCard = recruitTopCard(current.cards);
      if (isRecruitGuard(topCard)) {
        return {
          ...current,
          phase: "victory",
          turnPhaseIndex: 2,
          victory: true,
          opponentLordPower: 0,
          logs: pushLog(
            current,
            "徵",
            "징집페이즈 생략",
            "징집소 지키는 이리가 맨 위에 있어 남은 징집을 생략했습니다.",
            before,
          ),
        };
      }
      const { cards, drawnCards } = drawTop(current.cards, 1, "hand");
      if (drawnCards.length === 0) return current;
      const nextDrawCount = current.phase === "playerTurn" ? current.playerTurnDraws + 1 : current.playerTurnDraws;
        return {
          ...current,
          cards,
          playerTurnDraws: nextDrawCount,
          turnPhaseIndex: nextDrawCount >= 2 ? 2 : 1,
          animatingCardIds: drawnCards.map((card) => card.id),
        logs: pushLog(
          current,
          "徵",
          current.phase === "playerTurn" ? `${nextDrawCount}/2 징집` : "1장 징집",
          `${shortCardName(drawnCards[0].name)}을(를) 군영으로 가져왔습니다.`,
          before,
        ),
      };
    });
    window.setTimeout(() => {
      setState((current) => ({ ...current, animatingCardIds: [] }));
    }, 520);
    window.setTimeout(() => {
      setState((current) => {
        if (current.phase !== "playerTurn" || current.playerTurnDraws < 2 || current.victory) return current;
        return {
          ...current,
          phase: "victory",
          victory: true,
          opponentLordPower: 0,
          logs: pushLog(
            current,
            "勝",
            "승리",
            "직접 2장을 징집했습니다. 하룻 이리가 패배합니다.",
            snapshot(current),
          ),
        };
      });
    }, 760);
  };

  const acknowledgeDrawGuide = () => {
    setState((current) => ({ ...current, drawGuideAcknowledged: true }));
  };

  const activeTourZone = state.phase === "tour" ? tourSteps[state.tourIndex].zone : null;
  const shouldGuideDraw = !isFreePlay && state.phase === "playerTurn" && state.playerTurnDraws < 2;
  const shouldShowDrawGuideModal = shouldGuideDraw && !state.drawGuideAcknowledged;
  const expandedCard = state.cardModalId ? state.cards.find((card) => card.id === state.cardModalId) : null;
  const coinResultFace = campaign.firstPlayer.includes("후공") ? "後" : "先";
  const fieldDimmed = state.phase === "tour" || shouldShowDrawGuideModal;

  return (
    <div className={tutorialUi.root}>
      <TutorialScopedStyles />
      <div className={tutorialUi.orientationLock} role="alert" aria-live="assertive">
        <div className={tutorialUi.orientationPanel}>
          <RotateCcw aria-hidden="true" />
          <strong>데스크탑으로 접속해주세요</strong>
          <span>튜토리얼은 넓은 화면에서만 진행할 수 있습니다.</span>
        </div>
      </div>

      <div className={tutorialUi.floatingActions} aria-label="튜토리얼 메뉴">
        <PaperButton className={tutorialUi.overlayButton} contentClassName="gap-1.5" onClick={onExit}>
          <LogOut />
          나가기
        </PaperButton>
        <PaperButton
          className={tutorialUi.overlayButton}
          contentClassName="gap-1.5"
          onClick={() => setStageModalOpen(true)}
        >
          <List />
          튜토리얼 단계 선택
        </PaperButton>
      </div>

      {stageModalOpen && (
        <PaperModal
          className="fixed inset-0 z-[90] bg-black/60"
          childrenClassName="mt-0 grid w-full gap-4"
          panelClassName={tutorialUi.stageModal}
          eyebrow="tutorial stages"
          title="튜토리얼 단계 선택"
        >
            <header className={tutorialUi.stageHeader}>
              <span aria-hidden="true" />
              <PaperButton
                className={cn(tutorialUi.overlayButton, tutorialUi.stageClose)}
                contentClassName="gap-0"
                aria-label="단계 선택 닫기"
                onClick={() => setStageModalOpen(false)}
              >
                <X />
              </PaperButton>
            </header>
            <div className={tutorialUi.stageList}>
              {campaigns.map((item, index) => (
                <PaperButton
                  key={item.id}
                  className={cn(
                    tutorialUi.stageListButton,
                    index === campaignIndex && tutorialUi.stageListButtonActive,
                  )}
                  contentClassName={tutorialUi.stageListButtonContent}
                  variant="secondary"
                  onClick={() => resetCampaign(index)}
                >
                  <span className={tutorialUi.stageNumber}>{item.number}</span>
                  <strong className={tutorialUi.stageName}>{item.title}</strong>
                  <em className={tutorialUi.stageSubtitle}>{item.subtitle}</em>
                </PaperButton>
              ))}
            </div>
        </PaperModal>
      )}

      <section className={tutorialUi.layout}>
        <div
          className={cn(tutorialUi.engine, fieldDimmed && tutorialUi.tourDim)}
          style={
            {
              "--tutorial-board-bg": `url("${tutorialAssetPath(tutorialBoardPath)}")`,
            } as CSSProperties
          }
        >
          <div
            className={cn(tutorialUi.boardBgLayer, tutorialUi.boardBgLayerTop)}
            aria-hidden="true"
          >
            <img
              className={cn(tutorialUi.boardBgImageTop)}
              src={tutorialAssetPath(tutorialBoardPath)}
              alt=""
              aria-hidden="true"
            />
          </div>
          <div
            className={cn(
              tutorialUi.boardBgLayer,
              tutorialUi.boardBgLayerBottom,
              tutorialUi.boardBgLayerBottomFade,
            )}
            aria-hidden="true"
          >
            <img
              className={tutorialUi.boardBgImageBottom}
              src={tutorialAssetPath(tutorialBoardPath)}
              alt=""
              aria-hidden="true"
            />
          </div>

          {state.phase === "intro" && (
            <TutorialModal
              className="absolute inset-0 z-[60] grid place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(196,223,238,0.14),transparent_32%),linear-gradient(180deg,rgba(0,0,0,0.72),rgba(0,0,0,0.62))] p-[18px] backdrop-blur-[3px]"
              eyebrow={`tutorial ${campaign.number}`}
              title={campaign.title}
              description={campaign.subtitle}
            >
              <InkButton onClick={startTutorial}>튜토리얼 {campaign.number} 시작</InkButton>
            </TutorialModal>
          )}

          {state.phase === "tour" && (
            <div className={tutorialUi.tourOverlay}>
              <div
                className={cn(
                  tutorialUi.tourCard,
                  tourCardPositionClass[tourSteps[state.tourIndex].zone],
                )}
                style={
                  {
                    "--paper-modal-bg": `url("${tutorialAssetPath(tutorialPaperModalPath)}")`,
                  } as CSSProperties
                }
              >
                <p className="eyebrow">field tour</p>
                <h2>{tourSteps[state.tourIndex].title}</h2>
                <p>{tourSteps[state.tourIndex].detail}</p>
                <button type="button" onClick={advanceTour}>
                {state.tourIndex === tourSteps.length - 1 ? "코인플립으로" : "다음"}
                </button>
              </div>
            </div>
          )}

          {state.phase === "coin" && (
            <div className={tutorialUi.coinOverlay}>
              <div
                className={cn(tutorialUi.coinToken, state.coinFlipping && tutorialUi.coinTokenFlipping)}
                style={
                  {
                    "--coin-result-rotation": coinResultFace === "後" ? "900deg" : "720deg",
                  } as CSSProperties
                }
              >
                <span className={tutorialUi.coinFace}>先</span>
                <span className={cn(tutorialUi.coinFace, tutorialUi.coinBack)}>後</span>
              </div>
              <strong className={tutorialUi.coinLabel}>{campaign.firstPlayer}</strong>
            </div>
          )}

          {state.phase === "mulliganIntro" && (
            <TutorialModal
              className={tutorialUi.modalOverlay}
              compact
              eyebrow="mulligan"
              title="멀리건"
              description="게임 시작 전에 징집소 위에서 4장을 공개합니다. 이 4장을 먼저 문지기로 세울지, 군영으로 사용할지 선택하게 됩니다."
            >
              <PaperButton className="[--paper-button-height:38px] [--paper-button-padding-x:22px]" onClick={drawToMulligan}>
                4장 공개하기
              </PaperButton>
            </TutorialModal>
          )}

          {shouldShowDrawGuideModal && (
            <TutorialModal
              className={tutorialUi.modalOverlay}
              compact
              eyebrow={`나의 턴 · ${turnPhaseNames[state.turnPhaseIndex]}`}
              title="징집"
              description="내 징집소를 클릭해서 카드를 군영으로 가져오세요."
            >
              <PaperButton className="[--paper-button-height:38px] [--paper-button-padding-x:22px]" onClick={acknowledgeDrawGuide}>
                이해했어
              </PaperButton>
            </TutorialModal>
          )}

          {state.turnBanner && <div className={tutorialUi.turnBanner}>{state.turnBanner}</div>}

          <div className={tutorialUi.opponent}>
            <RecruitStackZone
              cards={campaign.opponentDeck.map((name, index) => ({
                id: `${campaign.id}-opponent-${index}`,
                name,
                zone: "recruit",
                owner: "opponent",
                deckIndex: index,
              }))}
              onClick={() => undefined}
              label="상대 징집소"
            />
            <button
              className={cn(
                tutorialUi.opponentLord,
                state.victory && "animate-[lordBreak_900ms_ease_both]",
                activeTourZone === "opponentLord" && tutorialUi.tourHighlight,
              )}
              type="button"
              onClick={() => undefined}
            >
              <img
                className={tutorialUi.opponentArt}
                src={tutorialAssetPath(campaign.opponentLordArt)}
                alt=""
                aria-hidden="true"
              />
              <span className={tutorialUi.opponentLabel}>상대 성주</span>
              <strong className={tutorialUi.opponentName}>{campaign.opponentLord}</strong>
              <em className={tutorialUi.opponentPower}>힘 {state.opponentLordPower}</em>
              {state.opponentBubble && <b className={tutorialUi.opponentSpeech}>{state.opponentBubble}</b>}
            </button>
            <ZoneSlot
              zone="grave"
              cards={[]}
              active={false}
              tourActive={false}
              selectedCardId={state.selectedCardId}
              animatingCardIds={state.animatingCardIds}
              onClick={() => undefined}
              onCardClick={selectCard}
            />
          </div>

          <div className={tutorialUi.fieldMain}>
            <BattlefieldZone
              cards={zones.battlefield}
              active={Boolean(selectedCard && selectedCard.zone === "hand")}
              selectedCardId={state.selectedCardId}
              animatingCardIds={state.animatingCardIds}
              onClick={() => moveSelectedTo("battlefield")}
              onCardClick={selectCard}
            />
            <GateZone
              cards={zones.gate}
              active={Boolean(selectedCard?.zone === "hand" && selectedCard.name.includes("문지기"))}
              tourActive={activeTourZone === "gate"}
              selectedCardId={state.selectedCardId}
              animatingCardIds={state.animatingCardIds}
              onClick={() => moveSelectedTo("gate")}
              onCardClick={selectCard}
            />
            <button
              className={cn(
                tutorialUi.opponentLord,
                "pointer-events-auto absolute left-1/2 top-[64.5%] w-[min(220px,34%)] -translate-x-1/2",
                activeTourZone === "opponentLord" && tutorialUi.tourHighlight,
              )}
              type="button"
              onClick={() => undefined}
            >
              <img
                className={tutorialUi.opponentArt}
                src={tutorialAssetPath(playerLordArtPath)}
                alt=""
                aria-hidden="true"
              />
              <span className={tutorialUi.opponentLabel}>내 성주</span>
              <strong className={tutorialUi.opponentName}>초보 영령</strong>
              <em className={tutorialUi.opponentPower}>{campaign.firstPlayer}</em>
            </button>
          </div>

          <div className={tutorialUi.camps}>
            <ZoneSlot
              zone="front"
              cards={zones.front}
              active={Boolean(selectedCard?.zone === "hand")}
              tourActive={false}
              selectedCardId={state.selectedCardId}
              animatingCardIds={state.animatingCardIds}
              onClick={() => moveSelectedTo("front")}
              onCardClick={selectCard}
            />
            <ZoneSlot
              zone="rear"
              cards={zones.rear}
              active={Boolean(selectedCard?.zone === "hand")}
              tourActive={false}
              selectedCardId={state.selectedCardId}
              animatingCardIds={state.animatingCardIds}
              onClick={() => moveSelectedTo("rear")}
              onCardClick={selectCard}
            />
          </div>

          <div className={tutorialUi.sideStacks}>
            <ZoneSlot
              zone="grave"
              cards={zones.grave}
              active={Boolean(selectedCard?.zone === "hand")}
              tourActive={false}
              selectedCardId={state.selectedCardId}
              animatingCardIds={state.animatingCardIds}
              onClick={() => moveSelectedTo("grave")}
              onCardClick={selectCard}
            />
            <RecruitStackZone
              cards={zones.recruit}
              onClick={drawOneFromRecruit}
              label="내 징집소"
              tourActive={activeTourZone === "recruit" || shouldGuideDraw}
            />
          </div>

          {zones.mulligan.length > 0 && (
            <section className={tutorialUi.mulliganRow} aria-label="초기 멀리건 선택">
              <div className={tutorialUi.mulliganCards}>
                {zones.mulligan.map((card) => (
                  <TutorialCard
                    key={card.id}
                    card={card}
                    selected={false}
                    drawing={state.animatingCardIds.includes(card.id)}
                    drawIndex={state.animatingCardIds.indexOf(card.id)}
                    onClick={() => undefined}
                  />
                ))}
              </div>
              <div className={tutorialUi.mulliganActions}>
                <Button
                  className="h-11 border-black/25 bg-[#111] px-8 text-base font-black text-[#f8f1df] shadow-[0_10px_22px_rgba(0,0,0,0.22)] hover:bg-[#26211c]"
                  type="button"
                  onClick={() => placeInitialGates("gate-first")}
                >
                  문지기 배치
                </Button>
                <Button
                  className="h-11 border-black/25 bg-[#fff8e8] px-8 text-base font-black text-[#211b14] shadow-[0_10px_22px_rgba(0,0,0,0.16)] hover:bg-white"
                  type="button"
                  variant="outline"
                  onClick={() => placeInitialGates("army-first")}
                >
                  군영으로 사용
                </Button>
              </div>
            </section>
          )}

          <section
            className={cn(
              tutorialUi.hand,
              state.selectedCardId && tutorialUi.handSelected,
              activeTourZone === "hand" && tutorialUi.tourHighlight,
            )}
            aria-label="군영"
          >
            <span className={tutorialUi.handLabel}>군영</span>
            {zones.hand.length === 0 ? (
              <p className={tutorialUi.handEmpty}>군영 비어 있음</p>
            ) : (
              zones.hand.map((card) => (
                <TutorialCard
                  key={card.id}
                  card={card}
                  selected={card.id === state.selectedCardId}
                  drawing={state.animatingCardIds.includes(card.id)}
                  drawIndex={state.animatingCardIds.indexOf(card.id)}
                  onClick={() => selectCard(card)}
                />
              ))
            )}
          </section>
        </div>

        {expandedCard && (
          <div className={tutorialUi.cardZoomBackdrop} onClick={closeCardModal} role="presentation">
            <div className={tutorialUi.cardZoomPanel} onClick={(event) => event.stopPropagation()}>
              <TutorialCard
                card={expandedCard}
                selected={expandedCard.id === state.selectedCardId}
                zoomed
                onClick={() => undefined}
              />
              <strong>{shortCardName(expandedCard.name)}</strong>
              <em>{zoneTitle(expandedCard.zone)}</em>
            </div>
          </div>
        )}

        {state.victory && (
          <TutorialModal
            className={tutorialUi.victoryBackdrop}
            panelClassName={tutorialUi.victoryModal}
            compact
            eyebrow="tutorial clear"
            title="승리!"
            description="멀리건과 첫 턴 징집까지 확인했습니다."
          >
            <PaperButton className="[--paper-button-height:38px] [--paper-button-padding-x:22px]" onClick={() => resetCampaign(1)}>
              다음 튜토리얼로
            </PaperButton>
          </TutorialModal>
        )}

      </section>
    </div>
  );
}
