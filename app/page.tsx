'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  TrendingUp, 
  BarChart3, 
  FileText,
  ArrowRight,
  Factory,
  CheckCircle
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <Factory className="h-12 w-12" />
            <h1 className="text-5xl font-bold">Steel Production ERP</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-3xl">
            Comprehensive Procurement Tracking System for Material Requests, 
            Purchase Orders, and Real-time Status Monitoring
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Quick Stats */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Material Request Entry */}
            <Link href="/material-request">
              <Card className="hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500 h-full">
                <CardHeader className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Package className="h-8 w-8" />
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">Material Request</CardTitle>
                  <CardDescription className="text-blue-100">
                    Submit new material requests
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Enter raw material & consumable requests</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Link to job orders with drawings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Set urgency & required dates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Check inventory stock levels</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-4" variant="outline">
                    Create Request
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Procurement Tracking */}
            <Link href="/procurement">
              <Card className="hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-indigo-500 h-full">
                <CardHeader className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-8 w-8" />
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">Procurement Tracking</CardTitle>
                  <CardDescription className="text-indigo-100">
                    Manage procurement workflow
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Track all material requests</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Add quotations & suppliers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Update request status</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Record action history</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-4" variant="outline">
                    View Requests
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Status Dashboard */}
            <Link href="/dashboard">
              <Card className="hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-green-500 h-full">
                <CardHeader className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <BarChart3 className="h-8 w-8" />
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">Live Dashboard</CardTitle>
                  <CardDescription className="text-green-100">
                    Real-time status monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Live status updates (auto-refresh)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>View for all teams (Store/Production/Project)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Urgency alerts & overdue items</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Filter & search capabilities</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-4" variant="outline">
                    View Dashboard
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Complete Tracking</h3>
                <p className="text-sm text-slate-600">
                  Track materials from request to delivery with full history
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Inventory Integration</h3>
                <p className="text-sm text-slate-600">
                  Check stock levels before requesting new materials
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Urgency Management</h3>
                <p className="text-sm text-slate-600">
                  Priority levels with visual alerts for critical items
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Real-time Updates</h3>
                <p className="text-sm text-slate-600">
                  Live dashboard updates every 10 seconds automatically
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User Roles Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>For Different Teams</CardTitle>
            <CardDescription>Designed for all stakeholders in the procurement process</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Production Team</h4>
                <p className="text-sm text-blue-700">
                  Submit material requests linked to job orders, specify urgency, and track approval status
                </p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-semibold text-indigo-900 mb-2">Procurement Team</h4>
                <p className="text-sm text-indigo-700">
                  Manage requests, add quotations, create POs, and update progress through workflow
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Store/Project Teams</h4>
                <p className="text-sm text-green-700">
                  Monitor delivery status, track receipts, and view real-time updates for planning
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
