import MPContactWidget from '@/components/MPContactWidget'

export default function MPPage() {
  return (
    <div className="ui-page max-w-3xl">
      <div className="mb-8">
        <h1 className="ui-hero-title">Find Your MP</h1>
        <p className="ui-hero-sub max-w-2xl">
          Enter a Canadian postal code to look up your Member of Parliament, view their official profile, and start a message.
        </p>
      </div>

      <div className="max-w-md">
        <MPContactWidget />
      </div>
    </div>
  )
}
