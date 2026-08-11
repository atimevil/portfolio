// 썸네일이 없는 프로젝트에 쓰는 대체 배너. 밋밋한 단색 그라디언트 대신
// 도트 패턴 텍스처 + 제목 첫 글자를 큼직한 모노그램으로 넣어 카드마다 다르게 보이게 한다.
export default function ProjectBanner({ title, className }: { title: string; className: string }) {
  const monogram = title.trim().charAt(0)

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: 'linear-gradient(135deg, var(--color-accent-soft), var(--color-bg-secondary))' }}
    >
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: 'radial-gradient(var(--color-accent) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />
      <span
        className="relative select-none font-black text-accent opacity-25"
        style={{ fontSize: 'clamp(3rem, 14vw, 7rem)', lineHeight: 1 }}
      >
        {monogram}
      </span>
    </div>
  )
}
