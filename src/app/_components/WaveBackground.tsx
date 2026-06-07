export default function WaveBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[
        { cx: 60, cy: "85%", r: 2.5, delay: "0s", dur: "5s" },
        { cx: 130, cy: "78%", r: 1.5, delay: "1.2s", dur: "6.5s" },
        { cx: 200, cy: "90%", r: 3, delay: "0.6s", dur: "4.8s" },
        { cx: 280, cy: "82%", r: 2, delay: "2s", dur: "5.5s" },
        { cx: 350, cy: "88%", r: 1.5, delay: "0.3s", dur: "7s" },
        { cx: 410, cy: "80%", r: 2.5, delay: "1.8s", dur: "4.2s" },
        { cx: 90, cy: "70%", r: 1.5, delay: "3s", dur: "6s" },
        { cx: 320, cy: "75%", r: 2, delay: "1s", dur: "5.2s" },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.r * 2,
            height: p.r * 2,
            left: p.cx,
            bottom: p.cy,
            background: "rgba(52,211,153,0.35)",
            animation: `floatUp ${p.dur} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}

      <style>{`
        @keyframes waveMove1 {
          0%, 100% { transform: translateX(0) scaleY(1); }
          50%       { transform: translateX(-18px) scaleY(1.08); }
        }
        @keyframes waveMove2 {
          0%, 100% { transform: translateX(0) scaleY(1); }
          50%       { transform: translateX(22px) scaleY(0.94); }
        }
        @keyframes waveMove3 {
          0%, 100% { transform: translateX(0) scaleY(1); }
          50%       { transform: translateX(-12px) scaleY(1.12); }
        }
        @keyframes floatUp {
          0%   { transform: translateY(0); opacity: 0; }
          20%  { opacity: 0.6; }
          80%  { opacity: 0.3; }
          100% { transform: translateY(-120px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
