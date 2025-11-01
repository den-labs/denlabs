"use client";

import { Gem, Skull } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

const PRESET_BOMB_INDICES = new Set<number>([3, 7, 14]);

export default function MindGamesPage() {
  const t = useTranslations("MindGamesPage");
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [mineCount, setMineCount] = useState(1);
  const [betAmount, setBetAmount] = useState(100);
  const [isGameActive, setIsGameActive] = useState(false);

  const gridSize = 25;
  const balance = 100924;
  const profit = 394.39;
  const cells = useMemo(
    () =>
      Array.from({ length: gridSize }, (_, index) => ({
        id: `cell-${index}`,
        index,
      })),
    [],
  );
  const mineSelectId = "mind-games-mine-count";
  const betInputId = "mind-games-bet-amount";

  const handleCellClick = (index: number) => {
    if (!isGameActive) return;

    setSelectedCells((cells) =>
      cells.includes(index)
        ? cells.filter((i) => i !== index)
        : [...cells, index],
    );
  };

  const startGame = () => {
    setIsGameActive(true);
    setSelectedCells([]);
  };

  const cashout = () => {
    setIsGameActive(false);
  };

  return (
    <div className="space-y-8 text-wolf-foreground">
      <div className="wolf-card--muted rounded-[1.9rem] border border-wolf-border px-6 py-6 text-white/80">
        <p className="font-medium text-white">{t("intro.title")}</p>
        <p className="mt-2 text-sm text-white/70">{t("intro.description")}</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <section className="wolf-card flex-1 space-y-6 rounded-[2rem] border border-wolf-border-strong p-6 shadow-[0_45px_120px_-80px_rgba(0,0,0,0.75)]">
          <div className="flex items-center justify-between rounded-[1.5rem] border border-wolf-border-strong bg-wolf-charcoal-60 px-4 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-wolf-text-subtle">
                {t("summary.balance")}
              </p>
              <p className="text-2xl font-semibold text-white">
                € {balance.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-wolf-text-subtle">
                {t("summary.profit")}
              </p>
              <p className="text-lg font-semibold text-wolf-emerald">
                € {profit.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {cells.map(({ id, index }) => {
              const isSelected = selectedCells.includes(index);
              const isBomb = isSelected && PRESET_BOMB_INDICES.has(index);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleCellClick(index)}
                  className={`flex aspect-square items-center justify-center rounded-xl border-2 text-2xl transition-all duration-200
                    ${
                      isSelected
                        ? isBomb
                          ? "border-wolf-error-border-strong bg-wolf-error-glow text-[#ff969e]"
                          : "border-wolf-border-glow bg-wolf-emerald-tint text-wolf-emerald shadow-[0_12px_35px_-25px_rgba(160,83,255,0.55)]"
                        : "border-wolf-border-faint bg-wolf-charcoal-60 text-white/80 hover:border-wolf-border"
                    }
                  `}
                >
                  {isSelected &&
                    (isBomb ? (
                      <Skull className="h-6 w-6" aria-hidden />
                    ) : (
                      <Gem className="h-6 w-6 text-inherit" aria-hidden />
                    ))}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="wolf-card w-full max-w-sm space-y-4 rounded-[2rem] border border-wolf-border-strong p-6 shadow-[0_40px_110px_-80px_rgba(160,83,255,0.35)]">
          <div className="space-y-2">
            <label
              htmlFor={mineSelectId}
              className="text-xs uppercase tracking-[0.3em] text-wolf-text-subtle"
            >
              {t("controls.mines")}
            </label>
            <select
              id={mineSelectId}
              value={mineCount}
              onChange={(event) => setMineCount(Number(event.target.value))}
              className="w-full rounded-xl border border-wolf-border bg-wolf-charcoal-65 px-3 py-2 text-white/85 focus:border-wolf-border-xstrong focus:outline-none"
            >
              {[1, 2, 3, 24].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor={betInputId}
              className="text-xs uppercase tracking-[0.3em] text-wolf-text-subtle"
            >
              {t("controls.bet")}
            </label>
            <input
              id={betInputId}
              type="number"
              value={betAmount}
              onChange={(event) => setBetAmount(Number(event.target.value))}
              className="w-full rounded-xl border border-wolf-border bg-wolf-charcoal-65 px-3 py-2 text-white/85 focus:border-wolf-border-xstrong focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={startGame}
              className="flex-1 rounded-full bg-[linear-gradient(180deg,#c8ff64_0%,#8bea4e_55%,#3b572a_100%)] px-4 py-2 font-semibold uppercase tracking-[0.2em] text-[#0b1407] shadow-[0_0_24px_rgba(186,255,92,0.45)] transition hover:shadow-[0_0_30px_rgba(186,255,92,0.55)]"
            >
              {t("controls.start")}
            </button>
            <button
              type="button"
              onClick={cashout}
              disabled={!isGameActive}
              className={`flex-1 rounded-full px-4 py-2 font-semibold uppercase tracking-[0.2em] transition ${
                isGameActive
                  ? "bg-wolf-emerald-tint text-wolf-emerald hover:bg-wolf-emerald-strong"
                  : "cursor-not-allowed bg-wolf-neutral-haze text-wolf-text-subtle"
              }`}
            >
              {t("controls.cashout")}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
