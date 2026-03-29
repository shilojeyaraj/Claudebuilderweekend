'use client'

import { useState, useMemo } from 'react'
import BillCard from '@/components/BillCard'
import { getAllBills, getTopicTag, TOPIC_TAGS } from '@/lib/bills'

export default function Home() {
  const bills = getAllBills()
  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState('All')

  const filtered = useMemo(() => {
    return bills.filter((b) => {
      const matchesTopic = topic === 'All' || getTopicTag(b) === topic

      const matchesSearch =
        search === '' ||
        b.ShortTitleEn.toLowerCase().includes(search.toLowerCase()) ||
        b.LongTitleEn.toLowerCase().includes(search.toLowerCase()) ||
        b.NumberCode.toLowerCase().includes(search.toLowerCase()) ||
        b.SponsorPersonName.toLowerCase().includes(search.toLowerCase())

      return matchesTopic && matchesSearch
    })
  }, [bills, topic, search])

  return (
    <div className="ui-page">
      <div className="mb-8">
        <h1 className="ui-hero-title">
          What is Parliament working on right now?
        </h1>
        <p className="ui-hero-sub">
          A nonpartisan tracker of active bills in the Canadian House of Commons and Senate.
        </p>
      </div>

      <div className="ui-card ui-card-pad ui-filter-bar mb-6">
        <input
          type="search"
          placeholder="Search bills, sponsors, keywords…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ui-input"
        />
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="ui-select sm:w-52 shrink-0"
        >
          <option>All</option>
          {TOPIC_TAGS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <p className="ui-muted-count mb-4">
        Showing {filtered.length} of {bills.length} bills
      </p>

      {filtered.length === 0 ? (
        <div className="ui-empty-state">
          No bills match your filters. Try broadening your search.
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((bill) => (
            <BillCard key={bill.Id} bill={bill} />
          ))}
        </div>
      )}
    </div>
  )
}
