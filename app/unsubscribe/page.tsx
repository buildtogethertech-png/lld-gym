import Link from "next/link";

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const invalid = searchParams.status === "invalid";

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {invalid ? (
          <>
            <p className="text-4xl mb-4">⚠️</p>
            <h1 className="text-xl font-bold text-gray-100 mb-2">Invalid link</h1>
            <p className="text-gray-500 text-sm mb-6">
              This unsubscribe link is invalid or has expired. You can manage email preferences from your settings.
            </p>
          </>
        ) : (
          <>
            <p className="text-4xl mb-4">✅</p>
            <h1 className="text-xl font-bold text-gray-100 mb-2">You&apos;re unsubscribed</h1>
            <p className="text-gray-500 text-sm mb-6">
              You won&apos;t receive any more practice reminder emails from LLD Hub.
            </p>
          </>
        )}
        <Link
          href="/"
          className="inline-block bg-yellow-400 text-black text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-yellow-300 transition-colors"
        >
          Back to LLD Hub
        </Link>
      </div>
    </div>
  );
}
