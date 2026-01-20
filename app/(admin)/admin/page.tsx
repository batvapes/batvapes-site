export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Admin Panel</h1>

      <p className="text-neutral-400 max-w-2xl">
        This section is only for you. Here you&apos;ll be able to create new
        customers, generate unique referral links, and view detailed stats.
      </p>

      <div className="grid gap-4 md:grid-cols-3 mt-6">
        <div className="border border-neutral-800 rounded-xl p-4">
          <h2 className="font-semibold mb-2">Total Customers</h2>
          <p className="text-3xl font-bold">12</p>
        </div>

        <div className="border border-neutral-800 rounded-xl p-4">
          <h2 className="font-semibold mb-2">Active Referral Codes</h2>
          <p className="text-3xl font-bold">8</p>
        </div>

        <div className="border border-neutral-800 rounded-xl p-4">
          <h2 className="font-semibold mb-2">Total Signups</h2>
          <p className="text-3xl font-bold">27</p>
        </div>
      </div>

      <div className="mt-8 border border-neutral-800 rounded-xl p-4">
        <h2 className="font-semibold mb-3">Create New Customer (coming soon)</h2>
        <p className="text-neutral-500 text-sm">
          Later we&apos;ll add a form here that will generate a customer record
          and unique referral URL automatically.
        </p>
      </div>
    </div>
  );
}
