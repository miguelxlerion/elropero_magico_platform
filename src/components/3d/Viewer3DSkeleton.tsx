export function Viewer3DSkeleton({ label = "Preparando probador 3D" }: { label?: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center" role="status" aria-live="polite">
      <div className="relative size-44 [perspective:700px]">
        <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-salvia-300" />
        <div className="absolute inset-5 [transform:rotateX(72deg)]">
          <div className="size-full animate-[spin_5s_linear_infinite] rounded-full border-2 border-beige-300 border-t-salvia-500" />
        </div>
        <div className="absolute inset-12 [transform:rotateX(55deg)_rotateZ(45deg)]">
          <div className="skeleton-shimmer size-full rounded-2xl shadow-[0_30px_40px_-20px_rgba(21,20,18,0.35)]" />
        </div>
      </div>
      <p className="absolute bottom-[22%] text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-tinta-400">
        {label}
      </p>
    </div>
  );
}
