import LikedContent from "@/components/liked-content";

export default function LikedPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <LikedContent showHeader={true} showClearAll={true} />
    </div>
  );
}