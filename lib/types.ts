export interface Bill {
  Id: number
  NumberCode: string
  NumberPrefix: string
  Number: number
  LongTitleEn: string
  ShortTitleEn: string
  StatusNameEn: string
  LatestCompletedMajorStageNameEn: string
  LatestCompletedMajorStageNameWithChamberSuffix: string
  OngoingStageNameEn: string
  IsGovernmentBill: boolean
  IsHouseBill: boolean
  IsSenateBill: boolean
  OriginatingChamberNameEn: string
  SponsorPersonName: string
  SponsorAffiliationTitle: string
  SponsorConstituencyName: string
  LatestBillEventDateTime: string
  LatestBillEventTypeNameEn: string
  ParliamentNumber: number
  SessionNumber: number
  PassedHouseFirstReadingDateTime: string | null
  PassedHouseSecondReadingDateTime: string | null
  PassedHouseThirdReadingDateTime: string | null
  PassedSenateFirstReadingDateTime: string | null
  PassedSenateSecondReadingDateTime: string | null
  PassedSenateThirdReadingDateTime: string | null
  ReceivedRoyalAssentDateTime: string | null
  ReceivedRoyalAssent: boolean
  ShortLegislativeSummaryEn: string | null
  BillDocumentTypeNameEn: string
}

export interface SentimentVote {
  billId: number
  support: number
  oppose: number
}

export interface MPResult {
  name: string
  party: string
  district: string
  email: string | null
  url: string
  photo_url: string | null
}
