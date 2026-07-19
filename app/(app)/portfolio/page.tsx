import { PageContainer } from "@/components/layout/page-container"
import { PortfolioHeader } from "@/components/portfolio/portfolio-header"
import { PortfolioToolbar } from "@/components/portfolio/portfolio-toolbar"
import { PropertyStats } from "@/components/portfolio/property-stats"
import { PropertyList } from "@/components/portfolio/property-list"

export default function PortfolioPage() {
  return (
    <PageContainer>
      <PortfolioHeader />

      <PortfolioToolbar />

      <PropertyStats />

      <PropertyList />
    </PageContainer>
  )
}