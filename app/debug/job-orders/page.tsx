'use client'

import { useEffect, useState } from 'react'

export default function DebugJobOrders() {
  const [jobOrders, setJobOrders] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/job-orders?limit=100')
      .then(res => res.json())
      .then(data => {
        console.log('Job orders API response:', data)
        setJobOrders(data.jobOrders || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading job orders:', err)
        setLoading(false)
      })

    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        console.log('Clients API response:', data)
        setClients(data.clients || [])
      })
      .catch(err => console.error('Error loading clients:', err))
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Job Orders Debug Information</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">All Clients ({clients.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">ID</th>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Email</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id}>
                  <td className="border px-4 py-2 text-xs">{client.id}</td>
                  <td className="border px-4 py-2">{client.name}</td>
                  <td className="border px-4 py-2">{client.email || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">All Job Orders ({jobOrders.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Job Number</th>
                <th className="border px-4 py-2">Product</th>
                <th className="border px-4 py-2">ClientId</th>
                <th className="border px-4 py-2">Client Name (field)</th>
                <th className="border px-4 py-2">LPO/Contract No</th>
                <th className="border px-4 py-2">Client Object</th>
              </tr>
            </thead>
            <tbody>
              {jobOrders.map(jo => (
                <tr key={jo.id} className={jo.clientId ? '' : 'bg-yellow-50'}>
                  <td className="border px-4 py-2">{jo.jobNumber}</td>
                  <td className="border px-4 py-2">{jo.productName}</td>
                  <td className="border px-4 py-2">
                    {jo.clientId ? (
                      <span className="text-green-600 font-mono text-xs">{jo.clientId}</span>
                    ) : (
                      <span className="text-red-600">NULL</span>
                    )}
                  </td>
                  <td className="border px-4 py-2">{jo.clientName || 'N/A'}</td>
                  <td className="border px-4 py-2">{jo.lpoContractNo || 'N/A'}</td>
                  <td className="border px-4 py-2">
                    {jo.client ? (
                      <span className="text-green-600">{jo.client.name}</span>
                    ) : (
                      <span className="text-gray-400">No relation</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {jobOrders.filter(jo => !jo.clientId).length > 0 && (
          <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500">
            <p className="font-semibold">⚠️ Warning:</p>
            <p>{jobOrders.filter(jo => !jo.clientId).length} job orders have NO clientId set</p>
            <p className="text-sm mt-2">These job orders won't auto-fill client details when selected.</p>
          </div>
        )}
      </div>
    </div>
  )
}
