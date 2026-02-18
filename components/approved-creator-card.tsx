import Image from "next/image";

type ApprovedCreatorCardProps = {
  id: string;
  displayName: string;
  city: string;
  price: number;
};

export function ApprovedCreatorCard({ id, displayName, city, price }: ApprovedCreatorCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-800 bg-[#050505] transition duration-300 hover:scale-[1.01] hover:shadow-[0_18px_50px_rgba(255,255,255,0.08)]">
      <div className="relative aspect-[3/4] w-full border-b border-gray-800">
        <Image
          src={`/api/public/creator-image/${id}`}
          alt={displayName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>
      <div className="space-y-1 px-4 py-4">
        <h2 className="text-base font-semibold text-white">{displayName}</h2>
        <p className="text-sm text-gray-400">{city}</p>
        <p className="text-sm text-gray-400">${price}/month</p>
      </div>
    </article>
  );
}
