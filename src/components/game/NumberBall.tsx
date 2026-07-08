// Glossy 3D Number Ball - GoLucky style with DUAL COLOR support
// Shared component for all games (WinGo, K3, 5D, TrxWin)

interface NumberBallProps {
  num: number;
  size?: "normal" | "small" | "tiny";
}

const NumberBall = ({ num, size = "normal" }: NumberBallProps) => {
  const isTiny = size === "tiny";
  const isSmall = size === "small";
  const ballSize = isTiny ? 18 : isSmall ? 22 : 44;
  const fontSize = isTiny ? 8 : isSmall ? 9 : 16;
  const ringWidth = isTiny ? 1.5 : isSmall ? 2 : 3;

  // Color definitions (matching bet buttons)
  const GREEN = "#22c55e";
  const RED = "#ef4444";
  const VIOLET = "#a855f7";

  // Determine if dual-color ball
  const isDualColor = num === 0 || num === 5;

  // For dual-color: 0 = Red(left)+Violet(right), 5 = Green(left)+Violet(right)
  // For single-color: 1,3,7,9 = Green, 2,4,6,8 = Red
  // CRITICAL: Uses exact 50/50 split gradient for 0 and 5
  let leftColor = "";
  let rightColor = "";
  let singleColor = "";
  let ringColor = "";

  if (num === 0) {
    // Red (left 50%) + Violet (right 50%)
    leftColor = RED;
    rightColor = VIOLET;
    ringColor = RED;
  } else if (num === 5) {
    // Green (left 50%) + Violet (right 50%)
    leftColor = GREEN;
    rightColor = VIOLET;
    ringColor = GREEN;
  } else if ([1, 3, 7, 9].includes(num)) {
    singleColor = GREEN;
    ringColor = GREEN;
  } else {
    singleColor = RED;
    ringColor = RED;
  }

  return (
    <div
      style={{
        width: ballSize,
        height: ballSize,
        borderRadius: "50%",
        border: `${ringWidth}px solid ${ringColor}`,
        boxShadow: `
          inset 0 -2px 4px rgba(0,0,0,0.25),
          inset 0 2px 4px rgba(255,255,255,0.4),
          0 1px 4px rgba(0,0,0,0.2)
        `,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flexShrink: 0,
        overflow: "hidden",
        background: isDualColor ? "transparent" : singleColor,
      }}
    >
      {/* Dual-color split background for 0 and 5 */}
      {isDualColor && (
        <>
          {/* Left half */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "50%",
              height: "100%",
              background: leftColor,
            }}
          />
          {/* Right half */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "50%",
              height: "100%",
              background: rightColor,
            }}
          />
        </>
      )}

      {/* Glossy overlay for 3D effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: "50%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 40%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.15) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Specular highlight */}
      <div
        style={{
          position: "absolute",
          top: isTiny ? 1 : isSmall ? 2 : 4,
          left: isTiny ? 3 : isSmall ? 4 : 8,
          width: isTiny ? 5 : isSmall ? 6 : 12,
          height: isTiny ? 3 : isSmall ? 4 : 7,
          background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)",
          borderRadius: "50%",
        }}
      />

      {/* Number text */}
      <span
        style={{
          color: "#fff",
          fontWeight: 700,
          fontSize,
          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
          position: "relative",
          zIndex: 2,
        }}
      >
        {num}
      </span>
    </div>
  );
};

export default NumberBall;

// Note: Import getNumberColors, getNumberTextColor from @/lib/numberColors directly
