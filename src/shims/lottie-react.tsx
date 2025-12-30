import type { CSSProperties, ReactElement } from "react";
import { useEffect } from "react";

type LottieShimProps = {
  animationData?: unknown;
  loop?: boolean;
  style?: CSSProperties;
  onComplete?: () => void;
};

function LottieShim({
  loop = true,
  style,
  onComplete,
}: LottieShimProps): ReactElement {
  useEffect(() => {
    if (loop) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      onComplete?.();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [loop, onComplete]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        background:
          "linear-gradient(135deg, rgba(148,251,171,0.25), rgba(148,251,171,0.05))",
        color: "#0f1621",
        fontSize: 14,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 1,
        width: 200,
        height: 200,
        ...style,
      }}
      aria-live="polite"
      role="img"
    >
      DenLabs
    </div>
  );
}

const exportWithDefault = Object.assign(LottieShim, {
  default: LottieShim,
});

export default exportWithDefault;
export { LottieShim };
