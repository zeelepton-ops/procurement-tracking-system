import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Boxes, Warehouse, PackageSearch } from 'lucide-react'

export default function StorePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Store</h1>
          <p className="text-slate-600 text-sm">Manage inventory and assets</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/store/inventory">
            <Card className="hover:border-blue-200 hover:shadow-sm transition">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Inventory</CardTitle>
                <Boxes className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Manage stock items, quantities, minimums, and locations.
              </CardContent>
            </Card>
          </Link>

          <Link href="/store/assets">
            <Card className="hover:border-blue-200 hover:shadow-sm transition">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Assets</CardTitle>
                <Warehouse className="h-5 w-5 text-indigo-600" />
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Track machinery and assets with codes, locations, and status.
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
