import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar />
      {children}
      <Footer />
    </div>
  )
}
