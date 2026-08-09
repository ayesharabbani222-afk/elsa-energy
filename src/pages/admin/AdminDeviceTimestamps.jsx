import { useState } from 'react'
import DataTable from '../../components/ui/DataTable'

const timestampData = [
  { id:1,  device:'EMS PANEL',           lastDate:'2026-07-27 13:24:45', lastActive:'0 min(s) ago',   status:'Online'  },
  { id:2,  device:'Gulshan-e-Zia',       lastDate:'2026-07-27 13:24:45', lastActive:'0 min(s) ago',   status:'Online'  },
  { id:3,  device:'FICO EV',             lastDate:'2026-07-27 13:24:43', lastActive:'0 min(s) ago',   status:'Online'  },
  { id:4,  device:'Japan Electronics',   lastDate:'2026-07-27 13:24:35', lastActive:'0 min(s) ago',   status:'Online'  },
  { id:5,  device:'Red Chilli',          lastDate:'2026-07-27 13:24:15', lastActive:'0 min(s) ago',   status:'Online'  },
  { id:6,  device:'Delicia Warehouse',   lastDate:'2026-07-27 13:24:12', lastActive:'0 min(s) ago',   status:'Online'  },
  { id:7,  device:'CF SMART TECHNOLOGIES', lastDate:'2026-07-27 13:23:57', lastActive:'0 min(s) ago', status:'Online'  },
  { id:8,  device:'Supra Steel Furnaces',lastDate:'2026-07-27 13:22:58', lastActive:'1 min(s) ago',   status:'Online'  },
  { id:9,  device:'Fico',                lastDate:'2026-07-21 14:39:05', lastActive:'5 day(s) ago',   status:'Offline' },
  { id:10, device:'CF BAG',              lastDate:'2025-09-18 17:27:47', lastActive:'311 day(s) ago', status:'Offline' },
  { id:11, device:"IMRAN's HOUSE",       lastDate:'2026-07-20 09:11:02', lastActive:'6 day(s) ago',   status:'Offline' },
  { id:12, device:'C Power',             lastDate:'2026-07-19 08:02:41', lastActive:'7 day(s) ago',   status:'Offline' },
  { id:13, device:'PV GENSET SYNC',      lastDate:'2026-07-18 06:55:19', lastActive:'8 day(s) ago',   status:'Offline' },
]

export default function AdminDeviceTimestamps() {
  const [data] = useState(timestampData)

  const columns = [
    { key: 'device',     label: 'Device Name' },
    { key: 'lastDate',   label: 'Last Date Activity' },
    { key: 'lastActive', label: 'Last Active' },
    { key: 'status',     label: 'Status', render: v =>
        <span className={`badge ${v === 'Online' ? 'badge-success' : 'badge-neutral'}`}>{v}</span> },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Device Timestamps</h2>
          <p className="breadcrumb">Device Timestamps &ndash; Manage Device Timestamps</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchable={false}
        pageSize={10}
      />
    </div>
  )
}
