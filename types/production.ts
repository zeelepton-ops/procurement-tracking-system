// L3: Production Release
export interface ProductionRelease {
  id: string
  jobOrderItemId: string
  drawingNumber?: string
  releaseQty: number
  releaseWeight?: number
  status: 'PLANNING' | 'IN_PRODUCTION' | 'PENDING_INSPECTION' | 'APPROVED' | 'REWORK' | 'REJECTED'
  productionStartDate?: Date
  productionEndDate?: Date
  actualCompletionDate?: Date
  itpTemplateId?: string
  isDelivered: boolean
  deliveredQty?: number
  deliveryNoteId?: string
  inspectionCount: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
  inspections?: ProductionInspection[]
  jobOrderItem?: {
    id: string
    workDescription: string
    quantity?: number
    unit: string
    unitPrice?: number
    unitWeight?: number
    jobOrder?: {
      id: string
      jobNumber: string
      clientName?: string
    }
  }
}

// L4: Production Inspection
export interface ProductionInspection {
  id: string
  productionReleaseId: string
  inspectionNumber: number
  requestTimestamp: Date
  inspectionTimestamp?: Date
  result?: 'APPROVED' | 'REJECTED' | 'HOLD'
  remarks?: string
  inspectedBy?: string
  inspectedQty?: number
  approvedQty?: number
  rejectedQty?: number
  holdQty?: number
  createdAt: Date
  updatedAt: Date
}

// Request/Response types
export interface CreateReleaseRequest {
  jobOrderItemId: string
  drawingNumber?: string
  releaseQty: number
  itpTemplateId?: string
  productionStartDate?: Date
  productionEndDate?: Date
}

export interface PushForInspectionRequest {
  productionReleaseId: string
}

export interface CompleteInspectionRequest {
  productionReleaseId: string
  result: 'APPROVED' | 'REJECTED' | 'HOLD'
  remarks?: string
  inspectedBy: string
  inspectedQty?: number
  approvedQty?: number
  rejectedQty?: number
  holdQty?: number
}
