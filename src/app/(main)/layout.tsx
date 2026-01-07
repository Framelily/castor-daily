import { TopNav } from '@/components/layout/TopNav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopNav />
      <main className="flex-1 pt-16">{children}</main>
    </div>
  )
}
