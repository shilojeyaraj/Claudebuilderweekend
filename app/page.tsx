'use client'

import { useState, useMemo } from 'react'
import BillCard from '@/components/BillCard'
import { getAllBills, getTopicTag, TOPIC_TAGS } from '@/lib/bills'
import { useInterests } from '@/components/InterestsProvider'
import { extractInterestKeywords, getBillInterestMatchScore } from '@/lib/interests'

export default function Home() {
  const bills = getAllBills()
  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState('All')
  const { userInterests, hasInterests } = useInterests()

  const filtered = useMemo(() => {
    return bills
      .filter((b) => {
        const matchesTopic = topic === 'All' || getTopicTag(b) === topic

        const matchesSearch =
          search === '' ||
          b.ShortTitleEn.toLowerCase().includes(search.toLowerCase()) ||
          b.LongTitleEn.toLowerCase().includes(search.toLowerCase()) ||
          b.NumberCode.toLowerCase().includes(search.toLowerCase()) ||
          b.SponsorPersonName.toLowerCase().includes(search.toLowerCase())

        return matchesTopic && matchesSearch
      })
      .sort((a, b) => {
        const aTopic = getTopicTag(a)
        const bTopic = getTopicTag(b)
        const aTopicPriority = userInterests.topics.includes(aTopic) ? 1 : 0
        const bTopicPriority = userInterests.topics.includes(bTopic) ? 1 : 0

        if (aTopicPriority !== bTopicPriority) {
          return bTopicPriority - aTopicPriority
        }

        if (aTopicPriority === 1 && bTopicPriority === 1) {
          const aTextPriority = getBillInterestMatchScore(a, userInterests.customText)
          const bTextPriority = getBillInterestMatchScore(b, userInterests.customText)
          if (aTextPriority !== bTextPriority) {
            return bTextPriority - aTextPriority
          }
        } else if (userInterests.topics.length === 0 && userInterests.customText.trim()) {
          const aTextPriority = getBillInterestMatchScore(a, userInterests.customText)
          const bTextPriority = getBillInterestMatchScore(b, userInterests.customText)
          if (aTextPriority !== bTextPriority) {
            return bTextPriority - aTextPriority
          }
        }

        return (
          new Date(b.LatestBillEventDateTime).getTime() -
          new Date(a.LatestBillEventDateTime).getTime()
        )
      })
  }, [bills, topic, search, userInterests.customText, userInterests.topics])

  const interestKeywords = useMemo(
    () => extractInterestKeywords(userInterests.customText),
    [userInterests.customText]
  )

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

      {hasInterests && (
        <div className="ui-card ui-card-pad mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Prioritizing your interests</p>
            <p className="ui-legal mt-1">
              Bills in your selected categories rise first. Keyword matches get bumped up within those groups.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {userInterests.topics.map((interestTopic) => (
              <span key={interestTopic} className="ui-tag-topic">
                {interestTopic}
              </span>
            ))}
            {interestKeywords.slice(0, 6).map((keyword) => (
              <span key={keyword} className="ui-tag-muted">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

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
