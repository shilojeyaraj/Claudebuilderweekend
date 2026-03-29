import MPContactWidget from '@/components/MPContactWidget'

export default function MPPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your MP</h1>
        <p className="text-gray-500 max-w-2xl">
          Enter a Canadian postal code to look up your Member of Parliament, view their official profile, and start a message.
        </p>
      </div>

      <div className="max-w-md">
        <MPContactWidget />
      </div>
    </div>
  )
}
