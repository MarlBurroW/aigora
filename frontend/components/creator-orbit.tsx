import { BrandMark } from "@/components/brand-mark";
import { CreatorIcon } from "@/components/creator-icon";
import { CREATOR_LABEL, type Creator } from "@/lib/creator";

/**
 * Animated home-hero centerpiece: the brand mark surrounded by a ring of
 * creator avatars at 45° intervals, each with a subtle floating animation
 * (staggered phases) to suggest "every major LLM tested here".
 */

const ORBIT_CREATORS: Creator[] = [
  "openai",
  "anthropic",
  "google",
  "mistral",
  "meta",
  "deepseek",
  "qwen",
  "xai",
];

const RADIUS = 175;
const SIZE = 410;

export function CreatorOrbit() {
  return (
    <div
      className="relative grid place-items-center"
      style={{ width: SIZE, height: SIZE }}
      aria-hidden
    >
      <BrandMark
        size={240}
        animated
        className="drop-shadow-[0_0_60px_rgba(59,92,255,0.4)]"
      />

      {ORBIT_CREATORS.map((c, i) => {
        const angle = (i * 360) / ORBIT_CREATORS.length - 90; // start at top
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * RADIUS;
        const y = Math.sin(rad) * RADIUS;
        const delay = (i * 0.4).toFixed(2);
        return (
          <div
            key={c}
            className="absolute"
            style={{ transform: `translate(${x}px, ${y}px)` }}
          >
            <div
              className="brand-orbit-float"
              style={{ animationDelay: `${delay}s` }}
              title={CREATOR_LABEL[c]}
            >
              <CreatorIcon
                creator={c}
                variant="avatar"
                size={42}
                className="rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.45)] ring-1 ring-white/10"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
